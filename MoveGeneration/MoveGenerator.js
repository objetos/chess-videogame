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

        //calculate squares attacked by enemy
        let attackedSquaresByEnemy = this.#calculateSquaresAttacked(enemyPieces, board);

        //King safety
        let king = piecesDict[pieceColor][E_PieceType.King][0];
        let squaresToAvoidCheck = GetBooleanBitboard(true);
        let moveFilterForPinnedPieces = {};
        let checkers = []
        let protectedPieces = 0n;

        if (king !== undefined) {
            //for every enemy piece
            for (let enemyPiece of enemyPieces) {
                //if is not a slider
                if (!enemyPiece.IsSlider()) {

                    //check if piece checks king
                    if (this.#isKingInCheck(king, enemyPiece.GetMoves(board))) {
                        checkers.push(enemyPiece);
                    }

                    let emptyBoard = new Board('8/8/8/8/8/8/8/8');
                    let enemyCapturingMovesInEmptyBoard;
                    if (enemyPiece.GetType() === E_PieceType.Pawn) {
                        enemyCapturingMovesInEmptyBoard = enemyPiece.GetCaptureSquares();
                    } else {
                        enemyCapturingMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                    }

                    protectedPieces |= enemyCapturingMovesInEmptyBoard & board.getOccupied(OppositePieceColor(king.color));

                } else {//if it is a slider
                    let slider = enemyPiece;

                    //if there's no space between slider and king
                    let emptySpaceBetweenSliderAndKing = GetRay(king.rank, king.file, slider.rank, slider.file, false, false);
                    if (emptySpaceBetweenSliderAndKing === 0n) {
                        //if slider is right next to the king
                        let isSliderBesidesKing = (king.GetMoves(board) & slider.position) > 0n;
                        if (isSliderBesidesKing) {
                            //slider is besides king, then it is checking he king.
                            checkers.push(slider);
                        } else {
                            //king is not within slider's range, do nothing.
                        }
                        continue;
                    }


                    //check for pinned pieces and discovered checkers.
                    //Taken from https://www.chessprogramming.org/Checks_and_Pinned_Pieces_(Bitboards)

                    let attacksFromSliderToKing = HyperbolaQuintessenceAlgorithm(board.getOccupied(), slider.position, emptySpaceBetweenSliderAndKing);
                    let attacksFromKingToSlider = HyperbolaQuintessenceAlgorithm(board.getOccupied(), king.position, emptySpaceBetweenSliderAndKing);
                    let intersection = (attacksFromKingToSlider[0] | attacksFromKingToSlider[1]) & (attacksFromSliderToKing[0] | attacksFromSliderToKing[1]);

                    //if there's no intersection
                    if (intersection === 0n) {
                        //there are two or more pieces in between slider and king. 
                        //Therefore, slider is not checking king and there are not pinned pieces nor enemy discovered checkes.
                        continue
                    } else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenSliderAndKing) {
                        //There's no pieces in between slider and king. Slider is distant-cheking the king
                        checkers.push(slider);
                        continue;
                    } else {
                        //There's one piece in between slider and king
                        //if the piece is an ally
                        let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                        if (isPieceAnAlly) {
                            //piece is pinned
                            moveFilterForPinnedPieces[intersection] = emptySpaceBetweenSliderAndKing | slider.position;
                        } else { //else piece is an enemy
                            //piece creates a discovered check
                            protectedPieces |= intersection;
                        }
                    }
                }
            }


            let kingMoves = this.#generateKingMoves(king, enemyPieces, protectedPieces, board);

            //if there's more than one checker
            if (1 < checkers.length) {
                //the only legal moves are king moves
                return kingMoves;
            } else if (checkers.length === 1) {
                //create filter to only allow moves that can block the check
                squaresToAvoidCheck = this.#calculateSquaresToAvoidCheck(king, checkers[0], board);
            }

            legalMoves = legalMoves.concat(kingMoves);
        }

        //calculate regular moves for each piece
        for (let piece of playingPieces) {
            //exclude calculation for king
            if (piece.GetType() === E_PieceType.King) continue;
            //get board with permitted moves
            let pieceMovesBitboard = piece.GetMoves(board);
            //filter moves if king is in check
            pieceMovesBitboard = pieceMovesBitboard & squaresToAvoidCheck;
            //filter moves if piece is pinned
            let isPiecePinned = moveFilterForPinnedPieces[piece.position] !== undefined;
            if (isPiecePinned) {
                let moveFilter = moveFilterForPinnedPieces[piece.position];
                pieceMovesBitboard = pieceMovesBitboard & moveFilter;
            }

            //continue if this piece has no moves
            if (pieceMovesBitboard === 0n) continue;

            //check for pawn special moves
            if (piece.GetType() === E_PieceType.Pawn) {
                let pawn = piece;

                if (pawn.CanPromote()) {
                    let promotionsMoves = this.#convertBitboard(pawn, pieceMovesBitboard, E_MoveFlag.Promotion);
                    legalMoves = legalMoves.concat(promotionsMoves);
                    continue;
                } else {
                    let enPassant = this.#generateEnPassantMove(pawn);
                    legalMoves = legalMoves.concat(enPassant);
                }
            }

            let pieceMoves = this.#convertBitboard(piece, pieceMovesBitboard, E_MoveFlag.Regular);
            legalMoves = legalMoves.concat(pieceMoves);
        }

        //generate castling moves
        let rooks = piecesDict[pieceColor][E_PieceType.Rook];
        let castlingMoves = this.#generateCastlingMoves(king, rooks, attackedSquaresByEnemy, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }

    #calculateSquaresToAvoidCheck(king, checker) {
        if (checker.IsSlider()) {
            return GetRay(checker.rank, checker.file, king.rank, king.file, true, false);
        } else {
            return checker.position;
        }
    }

    #calculateSquaresAttacked(enemyPieces, board) { //****** implement in board
        let attackedSquares = 0n;
        enemyPieces.forEach(piece => {
            let enemyPieceMoves = piece.GetMoves(board);
            attackedSquares = attackedSquares | enemyPieceMoves;
        });
        return attackedSquares;
    }

    #generateKingMoves(king, enemyPieces, protectedPieces, board) {

        let dangerousSquaresForKing = 0n;
        board.removePiece(king.rank, king.file, false);

        enemyPieces.forEach(piece => {
            if (piece.GetType() === E_PieceType.Pawn) {
                dangerousSquaresForKing = dangerousSquaresForKing | piece.GetCaptureSquares();
            } else {
                dangerousSquaresForKing = dangerousSquaresForKing | piece.GetMoves(board);
            }

        });

        board.addPiece(king, king.rank, king.file, false);

        let kingRegularMoves = king.GetMoves(board);

        dangerousSquaresForKing = dangerousSquaresForKing | protectedPieces;

        let kingMovesBitboard = kingRegularMoves & ~dangerousSquaresForKing;
        return this.#convertBitboard(king, kingMovesBitboard, E_MoveFlag.Regular);
    }

    #isKingInCheck(king, attackedSquares) {
        return (king.position & attackedSquares) > 1n;
    }

    #generateEnPassantMove(pawn) {
        //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
        if (this.#g_LastPawnJump == null) return [];

        //The capturing pawn must have advanced exactly three ranks to perform this move.
        if (pawn.rank === ENPASSANT_CAPTURING_RANKS[pawn.color]) {
            //The captured pawn must be right next to the capturing pawn.
            let fileDiff = Math.abs(g_LastPawnJump.endFile - pawn.file);
            if (fileDiff === 1) {
                //You move your pawn diagonally to an adjacent square, one rank farther from where it had been, 
                //on the same file where the enemy's pawn is.
                return new Move(pawn.rank, pawn.file, pawn.rank + 1, g_LastPawnJump.endFile, E_MoveFlag.EnPassant);
            }
        } else {
            return [];
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
    #generateCastlingMoves(king, rooks, attackedSquares, board) {
        //assumptions: king is a piece object. There's only one king. rooks is an array.
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king can not have moved
        if (king.hasMoved) return [];
        //The king cannot be in check
        if (this.#isKingInCheck(king, attackedSquares)) return [];

        let castlingMoves = [];
        for (let rook of rooks) {
            //The rook can not have moved
            if (rook.hasMoved) continue;

            //is it a queen-side or king-side castling?
            let castlingMoveFlag = king.file > rook.file ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;

            //No pieces can be between the king and rook
            //let castlingPath = this.#castlingPaths[rook.color][castlingMoveFlag];
            let castlingPath = castlingMoveFlag === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n | king.position << 3n :
                king.position >> 1n | king.position >> 2n;

            let isCastlingPathObstructed = (board.getEmptySpaces() & castlingPath) !== castlingPath;

            //Your king can not pass through check
            let kingPathToCastle = castlingMoveFlag === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n :
                king.position >> 1n | king.position >> 2n;

            let isKingPathChecked = (kingPathToCastle & attackedSquares) > 1n;


            if (!isCastlingPathObstructed && !isKingPathChecked) {
                let kingTargetFile = CASTLING_FILES[castlingMoveFlag][E_PieceType.King][1];
                let rookTargetFile = CASTLING_FILES[castlingMoveFlag][E_PieceType.Rook][1];

                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, castlingMoveFlag);
                let rookMove = new Move(rook.rank, rook.file, rook.rank, rookTargetFile, castlingMoveFlag);

                castlingMoves.push(kingMove, rookMove);
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
