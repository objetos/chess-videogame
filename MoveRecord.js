class MoveRecord {
    /**
     * Records given move. Move must not have been made in the board.
     * @param {Move} move 
     * @param {Board} board Board in which given move is performed
     * @param {E_PieceColor} playingColor Color that performs given move
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

        let pieceInStart = board.getPieceOnRankFile(move.startRank, move.startFile);
        let isCapturingMove = board.getPieceOnRankFile(move.endRank, move.endFile) !== null || move.flag === E_MoveFlag.EnPassant;

        //add piece abbreviation
        //if piece in start is a pawn
        let isPawn = (pieceInStart === Quadrille.chessSymbols['P']) || (pieceInStart === Quadrille.chessSymbols['p']);
        if (isPawn) {
            //add departure file if it is a capturing move
            if (isCapturingMove) moveString += FileToLetter(move.startFile);
        } else {
            //add piece abbreviation
            moveString += pieceInStart;
        }

        //check if departure rank or file is ambiguous
        if (!isPawn) {

            let piecesInSameRank = false;
            let piecesInSameFile = false;
            let ambiguityExists = false;

            //for every legal move  
            let legalMoves = board.generateMoves(playingColor);
            for (let otherMove of legalMoves) {
                //except the current one 
                if (move.startRank === otherMove.startRank && move.startFile === otherMove.startFile) continue;
                //if pieces are the same and they have the same destination square
                let otherPiece = board.getPieceOnRankFile(otherMove.startRank, otherMove.startFile);
                let moveHasSameDestination = (otherMove.endRank === move.endRank) && (otherMove.endFile === move.endFile);
                if (pieceInStart === otherPiece && moveHasSameDestination) {

                    //There's an ambiguity!
                    ambiguityExists = true;
                    //if files are the same 
                    if (move.startFile === otherMove.startFile) {
                        //rank is ambiguous
                        piecesInSameFile = true;
                    }

                    //if ranks are the same
                    if (move.startRank === otherMove.startRank) {
                        //file is ambiguous
                        piecesInSameRank = true;
                    }

                }
            }

            //add disambiguation
            if (ambiguityExists && !piecesInSameFile && !piecesInSameRank) moveString += FileToLetter(move.startFile);
            if (ambiguityExists && piecesInSameRank) moveString += FileToLetter(move.startFile);
            if (ambiguityExists && piecesInSameFile) moveString += move.startRank;
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

        //add special moves marks
        switch (move.flag) {
            case E_MoveFlag.EnPassant:
                moveString += 'e.p';
                break;
            case E_MoveFlag.Promotion:
                moveString += '=' + pieceColorTypeToKey(playingColor, MoveInput.pieceSelectedForPromotion);
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