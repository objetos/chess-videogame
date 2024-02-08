class MoveGenerator {
    //g_LastPawnJump = null; ******
    #castlingMasks = { //****** change name
        [E_PieceColor.White]: {
            1: 0b01110000n,
            8: 0b0110n
        },
        [E_PieceColor.Black]: {
            1: 0x7000000000000000n,
            8: 0x600000000000000n
        }
    }

    /**
     * @param {BoardImplementation} board 
     * @param {E_PieceColor} pieceColor
     * @returns {Move[]} Array of legal moves of pieces of given color
     */
    GenerateMoves(board, pieceColor) {//****** assertions
        //secrets: how are moves calculated, transformation from bitboard to moves
        //input:board with pieces
        //output:array of moves with start and end position
        //test: visual test with individual pieces, premade arrays of moves, 
        //errors: null board --> crash,


        let legalMoves = [];
        let playingPieces = [];
        let pieces = board.GetPieces();

        for (let pieceType of Object.values(E_PieceType)) {
            playingPieces = playingPieces.concat(pieces[pieceColor][pieceType]);
        }

        //calculate regular moves for each piece
        playingPieces.forEach(piece => {
            //get board with permitted moves
            let pieceMoves = piece.GetMoves(board);
            let testBit = 1n;
            //for each square
            for (let index = 0; index < 64; index++) {
                //if square is permitted
                let squarePermitted = (pieceMoves & testBit) > 0n;
                if (squarePermitted) {
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
        let king = pieces[pieceColor][E_PieceType.King].pop();
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

    //****** Your king can NOT be in check. Your king can not pass through check. Imrpove method. Check for rank and file. Assertions
    /**
     * 
     * @param {King} king 
     * @param {Rook[]} rooks 
     * @param {BoardImplementation} board 
     * @returns 
     */
    #GenerateCastling(king, rooks, board) {
        //assumptions: king is a piece object. rooks is an array.
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //The king can not have moved
        if (king.hasMoved) return [];

        let castlingMoves = [];
        rooks.forEach(rook => {
            //The rook can not have moved
            if (rook.hasMoved) return;

            //No pieces can be between the king and rook.
            let emptySquares = board.GetEmptySpaces();
            let castlingMask = this.#castlingMasks[rook.color][rook.file];
            let castlingPathClear = (emptySquares & castlingMask) === castlingMask;

            if (castlingPathClear) {
                let kingTargetFile = king.file - 2 * Math.sign(king.file - rook.file);
                let rookTargetFile = king.file - 1 * Math.sign(king.file - rook.file);

                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, E_MoveFlag.Castling);
                let rookMove = new Move(rook.rank, rook.file, rook.rank, rookTargetFile, E_MoveFlag.Castling);

                castlingMoves.push(kingMove, rookMove);
            }
        });

        return castlingMoves;
    }

    #CanCaptureEnPassant(pawn) {
        //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
        if (g_LastPawnJump == null) return false;

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