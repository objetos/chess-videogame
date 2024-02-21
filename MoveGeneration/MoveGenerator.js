//****** CLASS PROLOG
class MoveGenerator {
    #g_LastPawnJump = null;// ******
    #castlingMasks = {
        [E_PieceColor.White]: {
            [E_MoveFlag.QueenSideCastling]: 0b01110000n,
            [E_MoveFlag.KingSideCastling]: 0b0110n
        },
        [E_PieceColor.Black]: {
            [E_MoveFlag.QueenSideCastling]: 0x7000000000000000n,
            [E_MoveFlag.KingSideCastling]: 0x600000000000000n
        }
    }

    /**
     * @param {Board} board 
     * @param {E_PieceColor} pieceColor
     * @returns {Move[]} Array of legal moves of pieces of given color
     */
    GenerateMoves(board, piecesDict, pieceColor) { //****** simplify. assumptions: board is a standard board of chess
        console.assert(board instanceof Board, "Invalid board");

        let legalMoves = [];
        let playingPieces = [];
        let enemyPieces = [];
        let enemyMovesBitboard = 0n;
        let king = piecesDict[pieceColor][E_PieceType.King][0];
        let rooks = piecesDict[pieceColor][E_PieceType.Rook];

        for (let pieceType of Object.values(E_PieceType)) {
            playingPieces = playingPieces.concat(piecesDict[pieceColor][pieceType]);
            enemyPieces = enemyPieces.concat(piecesDict[OppositePieceColor(pieceColor)][pieceType]);
        }

        //generate enemy moves
        enemyPieces.forEach(piece => {
            let pieceMoves = piece.GetMoves(board);
            enemyMovesBitboard = enemyMovesBitboard | pieceMoves;
        });

        //Calculate king Moves
        if (king !== undefined) {
            let kingMoves = this.#CalculateKingMoves(king, enemyMovesBitboard, board);
            //if king can't move
            if (kingMoves.length < 1) {
                //***** checkmate
            }//else if king can move but it is in check 
            else if (this.#IsKingInCheck(king, enemyMovesBitboard)) {
                //king moves are the only possible moves
                return kingMoves;
            } //else (king can move and it is not in check)
            else {
                //add king moves and continue
                legalMoves = legalMoves.concat(kingMoves);
            }
        }

        //calculate regular moves for each piece
        for (let piece of playingPieces) {
            //exclude calculation for king
            if (piece.GetType() === E_PieceType.King) continue;
            //get board with permitted moves
            let pieceMovesBitboard = piece.GetMoves(board);
            //continue if this piece has no moves
            if (pieceMovesBitboard === 0n) continue;
            //check for pawn special moves
            if (piece.GetType() === E_PieceType.Pawn) {
                let pawn = piece;
                let pawnPromotions = this.#CalculatePawnPromotions(pawn, board);
                if (0 < pawnPromotions.length) {
                    legalMoves = legalMoves.concat(pawnPromotions);
                    continue;
                } else {
                    let enPassant = this.#CalculateEnPassant(pawn);
                    legalMoves = legalMoves.concat(enPassant);
                }
            }

            //add moves
            let pieceMoves = this.#BitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Regular);
            legalMoves = legalMoves.concat(pieceMoves);
        }

        //generate castling moves
        let castlingMoves = this.#GenerateCastling(king, rooks, enemyMovesBitboard, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }


    #CalculateKingMoves(king, enemyMoves, board) {
        let kingMovesBitboard = king.GetMoves(board) & ~enemyMoves;
        return this.#BitboardToMoves(king, kingMovesBitboard, E_MoveFlag.Regular);
    }

    #IsKingInCheck(king, enemyMoves) {
        return (king.position & enemyMoves) > 1n;
    }

    #CalculatePawnPromotions(pawn, board) {
        //pawn must be on 2nd or 7th rank
        if (pawn.rank === RANKS_TO_PROMOTE[pawn.color]) {
            return this.#BitboardToMoves(pawn, pawn.GetMoves(board), E_MoveFlag.Promotion);
        } else {
            return [];
        }
    }

    #CalculateEnPassant(pawn) {
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
    #GenerateCastling(king, rooks, attackedSquares, board) {
        //assumptions: king is a piece object. There's only one king. rooks is an array.
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king can not have moved
        if (king.hasMoved) return [];
        //The king cannot be in check
        if (this.#IsKingInCheck(king, attackedSquares)) return [];

        let castlingMoves = [];
        for (let rook of rooks) {
            //The rook can not have moved
            if (rook.hasMoved) continue;

            //is it a queen-side or king-side castling?
            let castlingMoveFlag;
            if (king.file > rook.file) {
                castlingMoveFlag = E_MoveFlag.QueenSideCastling;
            } else {
                castlingMoveFlag = E_MoveFlag.KingSideCastling;
            }

            //Calculate path to castle
            let castlingPath = this.#castlingPaths[rook.color][castlingMoveFlag];

            //No pieces can be between the king and rook
            let isCastlingPathClear = (board.GetEmptySpaces() & castlingPath) === castlingPath;
            //Your king can not pass through check
            let isCastlingPathAttacked = attackedSquares & castlingPath;

            if (isCastlingPathClear && !isCastlingPathAttacked) {
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
    #BitboardToMoves(piece, movesBitboard, moveFlag) {
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