//****** CLASS PROLOG
class MoveGenerator {
    /**
     * @param {BoardImplementation} board 
     * @param {E_PieceColor} pieceColor
     * @returns {Move[]} Array of legal moves of pieces of given color
     */
    generateMoves(board, pieceColor) {
        assert(board instanceof BoardImplementation, "Invalid board");
        assertPieceColor(pieceColor);

        let legalMoves = [];
        let playingPieces = board.getPiecesOfType(pieceColor, E_PieceType.Any);
        let enemyPieces = board.getPiecesOfType(OppositePieceColor(pieceColor), E_PieceType.Any);

        //calculate data to ensure king safety
        let king = board.getPiecesOfType(pieceColor, E_PieceType.King)[0];
        let targetSquaresToAvoidCheck = getBooleanBitboard(true);//squares to block check or capture checkers
        let moveFilterForPinnedPieces = {};//filter for moves of pinned pieces

        if (king !== undefined) {
            let checkers = this.#calculateCheckers(king, enemyPieces, board);
            let kingSafeMoves = this.#generateKingSafeMoves(king, enemyPieces, board);

            //if there's more than one checker
            if (1 < checkers.length) {
                //the only possible moves are king moves
                return kingSafeMoves;
            } //else if there is just 1 checker
            else if (checkers.length === 1) {
                //calculate squares that can block the check or capture checker
                targetSquaresToAvoidCheck = this.#calculateSquaresToAvoidCheck(king, checkers[0], board);
            }

            moveFilterForPinnedPieces = this.#calculatePinnedPieces(king, enemyPieces, board);
            legalMoves = legalMoves.concat(kingSafeMoves);
        }

        //calculate regular moves for each piece
        for (let piece of playingPieces) {
            //exclude calculation for king
            if (piece.GetType() === E_PieceType.King) continue;
            //get board with permitted moves
            let pieceMovesBitboard = piece.GetMoves(board);
            //filter moves if king is in check
            pieceMovesBitboard = pieceMovesBitboard & targetSquaresToAvoidCheck;
            //if piece is pinned, filter moves that do not discover a check
            let isPiecePinned = moveFilterForPinnedPieces[piece.position] !== undefined;
            if (isPiecePinned) {
                let moveFilter = moveFilterForPinnedPieces[piece.position];
                pieceMovesBitboard = pieceMovesBitboard & moveFilter;
            }

            //if a pawn is about to promote
            if (piece.GetType() === E_PieceType.Pawn && piece.isBeforePromotingRank()) {
                //add promotion moves
                let promotionsMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Promotion);
                legalMoves = legalMoves.concat(promotionsMoves);
            }// else, add regular piece moves
            else {
                let pieceMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Regular);
                legalMoves = legalMoves.concat(pieceMoves);
            }
        }

        //generate enpassant move
        let pawns = board.getPiecesOfType(pieceColor, E_PieceType.Pawn);
        let enPassantMoves = this.#generateEnPassantMoves(pawns, board);
        legalMoves = legalMoves.concat(enPassantMoves);
        //generate castling moves
        let rooks = board.getPiecesOfType(pieceColor, E_PieceType.Rook);
        let castlingMoves = this.#generateCastlingMoves(king, rooks, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }

    /**
     * 
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Array of pieces that check the king
     */
    #calculateCheckers(king, enemyPieces, board) {
        let checkers = [];
        for (let enemyPiece of enemyPieces) {
            let pieceChecksKing = (enemyPiece.GetMoves(board) & king.position) > 1n;
            if (pieceChecksKing) {
                assert(enemyPiece.GetType() !== E_PieceType.King, "A king cannot check another king");
                checkers.push(enemyPiece);
            }
        }
        return checkers;
    }

    /**
     * 
     * @param {King} king 
     * @param {bigint} protectedPieces 
     * @param {BoardImplementation} board 
     * @returns Array of moves the king can do safely
     */
    #generateKingSafeMoves(king, enemyPieces, board) {
        let dangerousSquaresForKing = 0n;
        board.removePiece(king.rank, king.file);//remove king temporarily to consider squares behind the king
        let squaresAttackedByEnemy = board.getAttackedSquares(OppositePieceColor(king.color));
        let dangerouseCaptures = this.#calculateProtectedPieces(enemyPieces, board);
        board.addPiece(king, king.rank, king.file);

        dangerousSquaresForKing = dangerouseCaptures | squaresAttackedByEnemy;

        let kingMovesBitboard = king.GetMoves(board) & ~dangerousSquaresForKing;
        return this.#bitboardToMoves(king, kingMovesBitboard, E_MoveFlag.Regular);
    }

    /**
     * 
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Bitboard of enemy pieces that are protected (i.e the enemy can recapture if they are captured)
     */
    #calculateProtectedPieces(enemyPieces, board) { // ****** repeated code, transfer to piece?
        let protectedPieces = 0n;
        //for every enemy piece
        for (let enemyPiece of enemyPieces) {
            //if it is a slider
            if (enemyPiece.IsSlider()) {
                let occupied = board.getOccupied();
                let rays = enemyPiece.getSlidingRays();
                let position = enemyPiece.position;
                let slidingMoves = 0n;

                rays.forEach(ray => {
                    let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
                    slidingMoves = slidingMoves | movesInRay.wholeRay;
                });


                protectedPieces |= slidingMoves & board.getOccupied(enemyPiece.color);

            } else if (enemyPiece.GetType() === E_PieceType.Pawn) {

                let pawnCapturingSquares = enemyPiece.GetCapturingSquares();
                protectedPieces |= pawnCapturingSquares & board.getOccupied(enemyPiece.color);

            } else if (enemyPiece.GetType() === E_PieceType.Knight | enemyPiece.GetType() === E_PieceType.King) {
                let emptyBoard = new BoardImplementation('8/8/8/8/8/8/8/8');
                let enemyMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                protectedPieces |= enemyMovesInEmptyBoard & board.getOccupied(enemyPiece.color);
            }
        }

        return protectedPieces;

    }

    /**
     * 
     * @param {King} king 
     * @param {Piece} checker 
     * @returns Bitboard with squares pieces can move to in order to avoid the check
     */
    #calculateSquaresToAvoidCheck(king, checker) {
        //if checker is a slider
        if (checker.IsSlider()) {
            //We can block the check by moving to any square between the slider and the king or capturing the slider
            return getRay(checker.rank, checker.file, king.rank, king.file, true, false);
        } //if piece is not a slider
        else {
            //We can avoid the check only by capturing the checker
            return checker.position;
        }
    }

    /**
     * 
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Object with pinned pieces and the filters for their moves
     */
    #calculatePinnedPieces(king, enemyPieces, board) {
        let moveFilterForPinnedPieces = {};
        //for every enemy piece
        for (let enemyPiece of enemyPieces) {
            //if it is not a slider, it cannot pin pieces
            if (!enemyPiece.IsSlider()) continue;

            let slider = enemyPiece;
            let sliderRays = slider.getSlidingRays();
            let rayFromSliderToKing = getRay(slider.rank, slider.file, king.rank, king.file, false, true);

            //if there's no possible ray between slider and king, king is not within slider's attack range, continue.
            if (rayFromSliderToKing === 0n) continue;

            //calculate if slider is allowed to move on the ray to the king
            let isSliderAllowedToMoveOnRay = false;
            for (let ray of sliderRays) {
                if ((ray & rayFromSliderToKing) > 0n) {
                    isSliderAllowedToMoveOnRay = true;
                }
            }
            //if slider is not allowed to move on the ray to the king, king is not within slider's attack range, do nothing. 
            if (!isSliderAllowedToMoveOnRay) continue;

            //check for pinned pieces
            //Taken from https://www.chessprogramming.org/Checks_and_Pinned_Pieces_(Bitboards)
            let attacksFromSliderToKing = hyperbolaQuintessenceAlgorithm(board.getOccupied(), slider.position, rayFromSliderToKing);
            let attacksFromKingToSlider = hyperbolaQuintessenceAlgorithm(board.getOccupied(), king.position, rayFromSliderToKing);
            let emptySpaceBetweenKingAndSlider = rayFromSliderToKing & ~king.position;
            let intersection = attacksFromKingToSlider.wholeRay & attacksFromSliderToKing.wholeRay;

            //if there's no intersection
            if (intersection === 0n) {

                //Option 1. There are two or more pieces in between slider and king. Therefore, there are not pinned pieces.
                //Option 2. Slider is besides the king and checking it. Slider is not pinning pieces.

            } //else if the intersection is equal to empty spaces
            else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenKingAndSlider) {
                //There's no pieces in between slider and king. Slider is distant-cheking the king.
            } else {
                //There's one piece in between slider and king
                //if the piece is an ally
                let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                if (isPieceAnAlly) {
                    //piece is being pinned by the slider.
                    //piece can only move in the ray from the slider to the king to avoid discovering a check
                    moveFilterForPinnedPieces[intersection] = rayFromSliderToKing | slider.position;
                }
            }
        }
        return moveFilterForPinnedPieces;
    }

    /**
     * 
     * @param {Pawn[]} pawns 
     * @param {BoardImplementation} board 
     * @returns Array of en passant moves
     */
    #generateEnPassantMoves(pawns, board) {
        let enPassantMoves = [];
        let enPassantInfo = board.getEnPassantInfo();
        for (let pawn of pawns) {
            //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
            if (enPassantInfo.rightToEnPassant === false) continue;

            //The capturing pawn must have advanced exactly three ranks to perform this move.
            if (pawn.rank !== ENPASSANT_CAPTURING_RANKS[pawn.color]) continue;

            //The captured pawn must be right next to the capturing pawn.
            let rankDiff = Math.abs(enPassantInfo.captureRank - pawn.rank);
            let fileDiff = Math.abs(enPassantInfo.captureFile - pawn.file);
            if (fileDiff !== 1 || rankDiff !== 0) continue;

            //You move your pawn diagonally to an adjacent square, one rank farther from where it had been, 
            //on the same file where the enemy's pawn is.
            let targetRank = pawn.color === E_PieceColor.White ? pawn.rank + 1 : pawn.rank - 1;
            let enPassant = new Move(pawn.rank, pawn.file, targetRank, enPassantInfo.captureFile, E_MoveFlag.EnPassant);
            //en passant move must be legal
            if (!this.#isEnPassantLegal(pawn.color, enPassant, board)) continue;

            enPassantMoves.push(enPassant);
        }
        return enPassantMoves;
    }

    /**
     * Checks if an en passant move is legal. Taken from: https://peterellisjones.com/posts/generating-legal-chess-moves-efficiently/
     * @param {E_PieceColor} playingColor 
     * @param {Move} enPassant 
     * @param {BoardImplementation} board 
     * @returns Whether the en passant move is legal
     */
    #isEnPassantLegal(playingColor, enPassant, board) {
        let capturedPawnRank = enPassant.startRank;
        let capturedPawnFile = enPassant.endFile;
        let capturingPawnRank = enPassant.startRank;
        let capturingPawnFile = enPassant.startFile;

        //check is king is currently in check
        let checkBeforeEnPassant = board.isKingInCheck(playingColor);

        //simulate making the en passant capture by removing both pieces
        let capturedPawn = board.removePiece(capturedPawnRank, capturedPawnFile);
        let capturingPawn = board.removePiece(capturingPawnRank, capturingPawnFile);

        //check if king is in check after making the en passant capture
        let checkAfterEnPassant = board.isKingInCheck(playingColor);

        //add removed pawns
        board.addPiece(capturedPawn, capturedPawnRank, capturedPawnFile);
        board.addPiece(capturingPawn, capturingPawnRank, capturingPawnFile);

        if (!checkBeforeEnPassant & !checkAfterEnPassant) {
            //en passant is legal
            return true;
        } else if (checkBeforeEnPassant && !checkAfterEnPassant) {
            //en passant blocks the check or captures pawn that was checking. Therefore, it is legal
            return true;
        } else if (!checkBeforeEnPassant & checkAfterEnPassant) {
            //en passant discovers a check. Therefore, it is illegal
            return false;
        } else if (checkBeforeEnPassant & checkAfterEnPassant) {
            //en passant discovered another check or enpassant move does not remove the check
            return false;
        }
    }

    /**
     * 
     * @param {King} king 
     * @param {Rook[]} rooks 
     * @param {BoardImplementation} board 
     * @returns Array of castling moves
     */
    #generateCastlingMoves(king, rooks, board) {
        //if there are no rooks or no king, castling is not possible
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king cannot be in check
        if (board.isKingInCheck(king.color)) return [];

        let castlingMoves = [];
        for (let rook of rooks) {
            //if rook is not on its initial square, skip
            if (!rook.isOnInitialSquare()) continue;

            //This side must have castling rights. That is, rooks cannot have moved or been captured and king cannot have moved.
            let castlingSide = king.file > rook.file ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
            if (!board.hasCastlingRights(rook.color, castlingSide)) continue;

            //There cannot be any piece between the rook and the king
            let castlingPath = castlingSide === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n | king.position << 3n :
                king.position >> 1n | king.position >> 2n;

            let isCastlingPathObstructed = (board.getEmptySpaces() & castlingPath) !== castlingPath;

            //Your king can not pass through check
            let attackedSquares = board.getAttackedSquares(OppositePieceColor(king.color));
            let kingPathToCastle = castlingSide === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n :
                king.position >> 1n | king.position >> 2n;

            let isKingPathChecked = (kingPathToCastle & attackedSquares) > 0n;

            if (!isCastlingPathObstructed && !isKingPathChecked) {
                let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King].endFile;
                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
                castlingMoves.push(kingMove);
            }
        }
        return castlingMoves;
    }


    /**
     * Converts a bitboard of moves into an array of moves with given flag
     * @param {Piece} piece 
     * @param {bigint} movesBitboard 
     * @param {E_MoveFlag} moveFlag 
     * @returns  Array of moves with given flag
     */
    #bitboardToMoves(piece, movesBitboard, moveFlag) {
        let moves = [];
        let testBit = 1n;

        if (movesBitboard === 0n) return [];
        //for each square
        for (let index = 0; index < 64; index++) {
            //if square is attacked by piece
            let squareAttacked = (movesBitboard & testBit) > 0n;
            if (squareAttacked) {
                //calculate end rank and file
                let endRank = Math.floor((index) / NUMBER_OF_FILES) + 1;
                let endFile = NUMBER_OF_FILES - (index % NUMBER_OF_FILES);
                //create move
                let newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                //add move to array
                moves.push(newMove);
            }

            //continue to next square
            testBit = testBit << 1n;
        }

        return moves;
    }
}
