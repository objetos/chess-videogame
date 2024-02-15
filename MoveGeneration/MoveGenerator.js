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
    GenerateMoves(board, pieces, pieceColor) { //****** simplify. assumptions: board is a standard board of chess
        console.assert(board instanceof Board, "Invalid board");

        let legalMoves = [];
        let playingPieces = [];

        for (let pieceType of Object.values(E_PieceType)) {
            playingPieces = playingPieces.concat(pieces[pieceColor][pieceType]);
        }

        //calculate regular moves for each piece
        playingPieces.forEach(piece => {

            //get board with permitted moves
            let pieceMoves = piece.GetMoves(board);
            let testBit = 1n;

            //continue if this piece has no moves
            if (pieceMoves === 0n) return;

            //for each square
            for (let index = 0; index < 64; index++) {

                //if square is attacked by piece
                let squareAttacked = (pieceMoves & testBit) > 0n;
                if (squareAttacked) {
                    //calculate end rank and file
                    let endRank = Math.floor((index) / 8) + 1;
                    let endFile = 8 - (index % 8);
                    let moveFlag = E_MoveFlag.Regular;

                    //check for pawn special moves
                    if (piece.GetType() === E_PieceType.Pawn) {
                        if (this.#CanPromote(piece, endRank)) moveFlag = E_MoveFlag.Promotion;
                        else if (this.#CanCaptureEnPassant(piece)) moveFlag = E_MoveFlag.EnPassant;
                    }

                    //create move
                    let newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                    //add move to array
                    legalMoves.push(newMove);
                }

                //continue to next square
                testBit = testBit << 1n;
            }
        });

        //generate castling moves
        let king = pieces[pieceColor][E_PieceType.King][0];
        let rooks = pieces[pieceColor][E_PieceType.Rook];
        let castlingMoves = this.#GenerateCastling(king, rooks, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }

    #CanPromote(pawn, endRank) {
        //white pawn reaches 8th rank
        if (pawn.color === E_PieceColor.White && endRank === 8) return true;
        //black pawn reaches 1st rank
        else if (pawn.color === E_PieceColor.Black && endRank === 1) return true;
        else false;
    }

    //****** Your king can NOT be in check. Your king can not pass through check. Check for rank and file. Assertions
    /**
     * 
     * @param {King} king 
     * @param {Rook[]} rooks 
     * @param {Board} board 
     * @returns 
     */
    #GenerateCastling(king, rooks, board) {
        //assumptions: king is a piece object. There's only one king. rooks is an array.
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king can not have moved
        if (king.hasMoved) return [];

        let castlingMoves = [];
        rooks.forEach(rook => {
            //The rook can not have moved
            if (rook.hasMoved) return;

            //is it a queen-side or king-side castling?
            let castlingMoveFlag;
            if (king.file > rook.file) {
                castlingMoveFlag = E_MoveFlag.QueenSideCastling;
            } else {
                castlingMoveFlag = E_MoveFlag.KingSideCastling;
            }

            //No pieces can be between the king and rook.
            let emptySquares = board.GetEmptySpaces();
            let castlingMask = this.#castlingMasks[rook.color][castlingMoveFlag];
            let castlingPathClear = (emptySquares & castlingMask) === castlingMask;

            if (castlingPathClear) {
                let kingTargetFile = Board.CASTLING_FILES[castlingMoveFlag][E_PieceType.King][1];
                let rookTargetFile = Board.CASTLING_FILES[castlingMoveFlag][E_PieceType.Rook][1];

                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, castlingMoveFlag);
                let rookMove = new Move(rook.rank, rook.file, rook.rank, rookTargetFile, castlingMoveFlag);

                castlingMoves.push(kingMove, rookMove);
            }
        });

        return castlingMoves;
    }

    #CanCaptureEnPassant(pawn) {
        //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
        if (this.#g_LastPawnJump == null) return false;

        //The capturing pawn must have advanced exactly three ranks to perform this move.
        let capturingPawnRank;
        if (pawn.color === E_PieceColor.White) {
            capturingPawnRank = 5;
        } else if (pawn.color === E_PieceColor.Black) {
            capturingPawnRank = 4;
        }
        if (pawn.rank === capturingPawnRank) {
            //The captured pawn must be right next to the capturing pawn.
            let fileDiff = Math.abs(g_LastPawnJump.endFile - pawn.file);
            if (fileDiff === 1) {
                //You move your pawn diagonally to an adjacent square, one rank farther from where it had been, on the same file where the enemy's pawn is
                return new Move(pawn.rank, pawn.file, pawn.rank + 1, g_LastPawnJump.endFile);
            }
        }
    }

}