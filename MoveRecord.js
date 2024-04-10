class MoveRecord {
    /**
     * 
     * @param {Move} move 
     * @param {Board} board
     */
    recordMove(move, board, playingColor) {
        //secrets: how it converts info to string internally, how moves are stored
        //preconditions: move has not been made in board
        //postconditions:updated record
        //input: move that was made on board and board
        //output: none
        //test: Basis and data-flow testing with several games

        let moveString = "";
        //if it is a castling move
        if (move.flag === E_MoveFlag.KingSideCastling) {
            moveString = "0-0";
            return moveString;
        } else if (move.flag === E_MoveFlag.QueenSideCastling) {
            moveString = "0-0-0"
            return moveString;
        }

        let pieceInStart = board.getPieceInRankFile(move.startRank, move.startFile);
        let isCapturingMove = board.getPieceInRankFile(move.endRank, move.endFile) !== null || move.flag === E_MoveFlag.EnPassant;

        //add piece abbreviation
        //if piece in start is a pawn
        let isPawn = pieceInStart === 'P' || pieceInStart === 'p';
        if (isPawn) {
            //add departure file if it is a capturing move
            if (isCapturingMove) moveString += FileToLetter(move.startFile);
        } else {
            //add piece abbreviation
            moveString += pieceInStart;
        }

        //check if rank or file is ambiguous
        if (!isPawn) {
            let otherMoves = board.generateMoves(playingColor);
            for (let otherMove of otherMoves) {
                if (move.startRank === otherMove.startRank && move.startFile === otherMove.startFile) continue;
                let piece = board.getPieceInRankFile(otherMove.startRank, otherMove.startFile);
                let moveHasSameDestination = (otherMove.endRank === move.endRank) && (otherMove.endFile === move.endFile);
                if (pieceInStart === piece && moveHasSameDestination) {
                    //both pieces have different files
                    if (move.startFile !== otherMove.startFile) {
                        //add departure file
                        moveString += FileToLetter(move.startFile);
                    }
                    //else if files are equal but ranks differ
                    else if (move.startRank !== otherMove.startRank) {
                        //add destination file
                        moveString += move.startRank;
                    }
                }
            }
        }

        //if move is a capture
        if (isCapturingMove) {
            //add capture mark
            moveString += 'x';
        }

        //add destination
        let rank = move.endRank.toString();
        let file = FileToLetter(move.endFile);
        let destination = file + rank;
        moveString += destination;

        //check same destination as other moves
        //add special moves marks
        switch (move.flag) {
            case E_MoveFlag.EnPassant:
                moveString += 'e.p';
                break;
            case E_MoveFlag.Promotion:
                moveString += '=' + pieceColorTypeToString(playingColor, MoveInput.pieceSelectedForPromotion);
                break;
        }

        //if it is a checkmate
        board.makeMove(move);
        let enemyColor = OppositePieceColor(playingColor);
        let enemyLegalMoves = board.generateMoves(enemyColor);
        let isEnemyKingInCheck = board.isKingInCheck(enemyColor);
        if (enemyLegalMoves.length === 0 && isEnemyKingInCheck) {
            //add checkmate mark
            moveString += '#';
        }//else if it is a check
        else if (enemyLegalMoves.length !== 0 && isEnemyKingInCheck) {
            //add check mark
            moveString += '+';
        }
        board.unmakeMove();

        return moveString;
    }
}