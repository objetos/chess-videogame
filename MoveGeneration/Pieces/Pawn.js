class Pawn extends Piece {
    GetType() {
        return E_PieceType.Pawn;
    }

    /**
     * 
     * @param {Board} board 
     * @returns 
     */
    GetMoves(board) {
        return this.GetCapturingMoves(board) | this.GetNonCapturingMoves(board);
    }


    /**
     * 
     * @param {Board} board 
     * @returns 
     */
    GetNonCapturingMoves(board) {
        let oneSquareFront;
        let twoSquaresFront;
        let targetRankForJumping;

        //****** transfer to data structure, use ? operator
        //calculate destination squares based on color 
        switch (this.color) {
            case E_PieceColor.White:
                oneSquareFront = (this.position << 8n);
                twoSquaresFront = (this.position << 16n);
                targetRankForJumping = 4;
                break;
            case E_PieceColor.Black:
                oneSquareFront = (this.position >> 8n);
                twoSquaresFront = (this.position >> 16n);
                targetRankForJumping = 5;
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        //calculate front move
        let frontMove = oneSquareFront &
            board.getEmptySpaces(); //target square is empty

        //calculate front jump
        let frontJump = twoSquaresFront &
            GetBooleanBitboard(frontMove > 1) & //a front move is possible
            board.getEmptySpaces() & //target square is empty 
            Board.getRank(targetRankForJumping); //pawn can only jump from their initial rank

        return frontJump | frontMove;
    }

    /**
     * 
     * @param {Board} board 
     * @returns 
     */
    GetCapturingMoves(board) {
        let rightDiagonalSquare;
        let leftDiagonalSquare;

        //****** transfer to data structure, use ? operator
        //calculate destination squares based on color 
        switch (this.color) {
            case E_PieceColor.White:
                rightDiagonalSquare = (this.position << 7n);
                leftDiagonalSquare = (this.position << 9n);
                break;
            case E_PieceColor.Black:
                rightDiagonalSquare = (this.position >> 9n);
                leftDiagonalSquare = (this.position >> 7n);
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        //calculate capture moves
        let rightCapture = rightDiagonalSquare &
            board.getOccupied(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.getFile(1); //remove right capture from 8th file to 1st file

        let leftCapture = leftDiagonalSquare &
            board.getOccupied(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.getFile(8); //remove right capture from 1st file to 8th file

        return leftCapture | rightCapture;
    }

    GetCaptureSquares() {
        let rightDiagonalSquare;
        let leftDiagonalSquare;

        //****** transfer to data structure, use ? operator
        //calculate destination squares based on color 
        switch (this.color) {
            case E_PieceColor.White:
                rightDiagonalSquare = (this.position << 7n);
                leftDiagonalSquare = (this.position << 9n);
                break;
            case E_PieceColor.Black:
                rightDiagonalSquare = (this.position >> 9n);
                leftDiagonalSquare = (this.position >> 7n);
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        //calculate capture moves
        let rightCapture = rightDiagonalSquare &
            ~Board.getFile(1); //remove right capture from 8th file to 1st file

        let leftCapture = leftDiagonalSquare &
            ~Board.getFile(8); //remove right capture from 1st file to 8th file

        return rightCapture | leftCapture;
    }

    CanPromote() {
        return this.rank === RANKS_TO_PROMOTE[this.color];
    }
}