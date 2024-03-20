//****** CLASS PROLOG
class MoveGenerator {
    #g_LastPawnJump = null;// ******


    /**
     * @param {Board} board 
     * @param {E_PieceColor} pieceColor
     * @returns {Move[]} Array of legal moves of pieces of given color
     */
    generateMoves(board, piecesDict, pieceColor) { //****** simplify. assumptions: board is a standard board of chess
        console.assert(board instanceof Board, "Invalid board");

        let legalMoves = [];
        let playingPieces = [];
        let enemyPieces = [];

        for (let pieceType of Object.values(E_PieceType)) {
            playingPieces = playingPieces.concat(piecesDict[pieceColor][pieceType]);
            enemyPieces = enemyPieces.concat(piecesDict[OppositePieceColor(pieceColor)][pieceType]);
        }

        //King safety
        let king = piecesDict[pieceColor][E_PieceType.King][0];
        let targetSquaresToAvoidCheck = GetBooleanBitboard(true);
        let moveFilterForPinnedPieces = {};

        if (king !== undefined) {
            //for every enemy piece
            let checkers = this.#calculateCheckers(enemyPieces, king, board);
            let kingSafeMoves = this.#generateKingSafeMoves(king, enemyPieces, board);

            //if there's more than one checker
            if (1 < checkers.length) {
                //the only legal moves are king moves
                return kingSafeMoves;
            } else if (checkers.length === 1) {
                //create filter to only allow moves that can block the check
                targetSquaresToAvoidCheck = this.#calculateSquaresToAvoidCheck(king, checkers[0], board);
                //pinned pieces
            }

            moveFilterForPinnedPieces = this.#calculatePinnedPieces(enemyPieces, king, board);
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
            //filter moves if piece is pinned
            let isPiecePinned = moveFilterForPinnedPieces[piece.position] !== undefined;
            if (isPiecePinned) {
                let moveFilter = moveFilterForPinnedPieces[piece.position];
                pieceMovesBitboard = pieceMovesBitboard & moveFilter;
            }

            //check for pawn special moves
            if (piece.GetType() === E_PieceType.Pawn) {
                let pawn = piece;

                if (pawn.CanPromote()) {
                    let promotionsMoves = this.#convertBitboard(pawn, pieceMovesBitboard, E_MoveFlag.Promotion);
                    legalMoves = legalMoves.concat(promotionsMoves);
                    continue;
                } else {
                    let enPassantMove = this.#generateEnPassantMove(pawn, board);
                    if (enPassantMove !== null && this.#isEnPassantLegal(pawn.color, enPassantMove, board)) legalMoves = legalMoves.concat(enPassantMove);
                }
            }

            let pieceMoves = this.#convertBitboard(piece, pieceMovesBitboard, E_MoveFlag.Regular);
            legalMoves = legalMoves.concat(pieceMoves);
        }

        //generate castling moves
        let rooks = piecesDict[pieceColor][E_PieceType.Rook];
        let castlingMoves = this.#generateCastlingMoves(king, rooks, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }

    #calculatePinnedPieces(enemyPieces, king, board) {
        let moveFilterForPinnedPieces = {};
        for (let enemyPiece of enemyPieces) {
            //if it is  a slider
            if (!enemyPiece.IsSlider()) continue;

            let slider = enemyPiece;
            let sliderRays = slider.getSlidingRays();
            let rayFromSliderToKing = GetRay(slider.rank, slider.file, king.rank, king.file, false, true);

            //if there's no possible ray between slider and king, king is not within slider's range, do nothing.
            if (rayFromSliderToKing === 0n) continue;

            let canSliderMoveOnRay = false;
            for (let ray of sliderRays) {
                if ((ray & rayFromSliderToKing) > 0n) {
                    canSliderMoveOnRay = true;
                }
            }
            //if slider can't move on ray, king is not within slider's range, do nothing. 
            if (!canSliderMoveOnRay) continue;

            //check for pinned pieces
            //Taken from https://www.chessprogramming.org/Checks_and_Pinned_Pieces_(Bitboards)
            let attacksFromSliderToKing = HyperbolaQuintessenceAlgorithm(board.getOccupied(), slider.position, rayFromSliderToKing);
            let attacksFromKingToSlider = HyperbolaQuintessenceAlgorithm(board.getOccupied(), king.position, rayFromSliderToKing);
            let intersection = (attacksFromKingToSlider[0] | attacksFromKingToSlider[1]) & (attacksFromSliderToKing[0] | attacksFromSliderToKing[1]);
            let emptySpaceBetweenKingAndSlider = rayFromSliderToKing & ~king.position;

            //if there's no intersection
            if (intersection === 0n) {
                //There are two or more pieces in between slider and king. Therefore, slider is not checking king and there are not pinned pieces.
                //OR slider is besides the king and checking it.
            } else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenKingAndSlider) {
                //There's no pieces in between slider and king. Slider is distant-cheking the king
            } else {
                //There's one piece in between slider and king
                //if the piece is an ally
                let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                if (isPieceAnAlly) {
                    //piece is pinned
                    moveFilterForPinnedPieces[intersection] = rayFromSliderToKing | slider.position;
                }
            }
        }
        return moveFilterForPinnedPieces;
    }

    #calculateCheckers(enemyPieces, king, board) {//****** change arguments order
        let checkers = [];
        for (let enemyPiece of enemyPieces) {
            let pieceChecksKing = (enemyPiece.GetMoves(board) & king.position) > 1n;
            if (pieceChecksKing) {
                checkers.push(enemyPiece); //****** check king checking king
            }
        }
        return checkers;
    }

    #calculateDangerousCaptures(enemyPieces, board) { // transfer to piece?
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
                    let moveRays = HyperbolaQuintessenceAlgorithm(occupied, position, ray);
                    slidingMoves = slidingMoves | moveRays[0] | moveRays[1];
                });


                protectedPieces |= slidingMoves & board.getOccupied(enemyPiece.color);

            } else if (enemyPiece.GetType() === E_PieceType.Pawn) {

                let pawnCapturingSquares = enemyPiece.GetCapturingSquares();
                protectedPieces |= pawnCapturingSquares & board.getOccupied(enemyPiece.color);

            } else if (enemyPiece.GetType() === E_PieceType.Knight | enemyPiece.GetType() === E_PieceType.King) {
                let emptyBoard = new Board('8/8/8/8/8/8/8/8');
                let enemyMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                protectedPieces |= enemyMovesInEmptyBoard & board.getOccupied(enemyPiece.color);
            }
        }

        return protectedPieces;

    }

    #calculateSquaresToAvoidCheck(king, checker) {
        if (checker.IsSlider()) {
            return GetRay(checker.rank, checker.file, king.rank, king.file, true, false);
        } else {
            return checker.position;
        }
    }

    /**
     * 
     * @param {King} king 
     * @param {bigint} protectedPieces 
     * @param {Board} board 
     * @returns 
     */
    #generateKingSafeMoves(king, enemyPieces, board) {
        let dangerousSquaresForKing = 0n;

        board.removePiece(king.rank, king.file, false);
        let squaresAttackedByEnemy = board.getAttackedSquares(OppositePieceColor(king.color));
        let dangerouseCapturesForKing = this.#calculateDangerousCaptures(enemyPieces, board);
        board.addPiece(king, king.rank, king.file, false);

        dangerousSquaresForKing = dangerouseCapturesForKing | squaresAttackedByEnemy;

        let kingMovesBitboard = king.GetMoves(board) & ~dangerousSquaresForKing;
        return this.#convertBitboard(king, kingMovesBitboard, E_MoveFlag.Regular);
    }

    /**
     * 
     * @param {Pawn} pawn 
     * @param {Board} board 
     * @returns 
     */
    #generateEnPassantMove(pawn, board) {
        let lastPawnJump = board.getLastPawnJump();
        //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
        if (lastPawnJump === null) return null;
        //The capturing pawn must have advanced exactly three ranks to perform this move.
        if (pawn.rank === ENPASSANT_CAPTURING_RANKS[pawn.color]) {
            //The captured pawn must be right next to the capturing pawn.
            let fileDiff = Math.abs(lastPawnJump.endFile - pawn.file);
            let rankDiff = Math.abs(lastPawnJump.endRank - pawn.rank);
            if (fileDiff === 1 && rankDiff === 0) {
                //You move your pawn diagonally to an adjacent square, one rank farther from where it had been, 
                //on the same file where the enemy's pawn is.
                let targetRank = pawn.color === E_PieceColor.White ? pawn.rank + 1 : pawn.rank - 1;
                return new Move(pawn.rank, pawn.file, targetRank, lastPawnJump.endFile, E_MoveFlag.EnPassant);
            } else {
                return null;
            }
        } else {
            return null;
        }
    }
    /**
     * 
     * @param {Pawn} capturedPawn 
     * @param {Pawn} capturingPawn 
     * @param {King} king 
     */
    #isEnPassantLegal(playingColor, enPassant, board) {// assumptions: king is checked by 1 piece at most
        let capturedPawnRank = enPassant.startRank;
        let capturedPawnFile = enPassant.endFile;
        let capturingPawnRank = enPassant.startRank;
        let capturingPawnFile = enPassant.startFile;

        let wasKingInCheck = board.isKingInCheck(playingColor);

        let capturedPawn = board.removePiece(capturedPawnRank, capturedPawnFile, false);
        let capturingPawn = board.removePiece(capturingPawnRank, capturingPawnFile, false);

        let isKingInCheck = board.isKingInCheck(playingColor);

        board.addPiece(capturedPawn, capturedPawnRank, capturedPawnFile, false);
        board.addPiece(capturingPawn, capturingPawnRank, capturingPawnFile, false);

        if (wasKingInCheck && !isKingInCheck) {//en passant blocks the check or captures pawn that was checking ****** organize if statements
            return true;
        } else if (!wasKingInCheck & isKingInCheck) {//en passant discovers a check
            return false;
        } else if (wasKingInCheck & isKingInCheck) {//en passant discovered another check or enpassant move does not remove the check
            return false;
        } else if (!wasKingInCheck & !isKingInCheck) {
            return true;
        }
    }

    //****** Check for rank and file. Assertions
    /**
     * 
     * @param {King} king 
     * @param {Rook[]} rooks 
     * @param {Board} board 
     * @returns 
     */
    #generateCastlingMoves(king, rooks, board) {
        //assumptions: king is a piece object. There's only one king. rooks is an array.
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king cannot be in check
        if (board.isKingInCheck(king.color)) return [];

        let castlingMoves = [];
        for (let rook of rooks) {
            //is it a queen-side or king-side castling?
            let castlingSide = king.file > rook.file ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
            //This side must have castling rights. That is, rooks cannot have moved or been captured and king cannot have moved.
            if (!board.hasCastlingRights(rook.color, castlingSide)) continue;

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
                let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King][1];
                let rookTargetFile = CASTLING_FILES[castlingSide][E_PieceType.Rook][1];

                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
                castlingMoves.push(kingMove);
            }
        }
        return castlingMoves;
    }

    //****** change name
    #convertBitboard(piece, movesBitboard, moveFlag) {
        let moves = [];
        let testBit = 1n;

        if (movesBitboard === 0n) return [];
        //for each square
        for (let index = 0; index < 64; index++) {
            //if square is attacked by piece
            let squareAttacked = (movesBitboard & testBit) > 0n;
            if (squareAttacked) {
                //calculate end rank and file
                let endRank = Math.floor((index) / 8) + 1;
                let endFile = 8 - (index % 8);
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
