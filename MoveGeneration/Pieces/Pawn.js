class Pawn extends Piece {
    GetType() {
        return E_PieceType.Pawn;
    }

    GetMoves(board) {
        let rightDiagonalSquare;
        let leftDiagonalSquare;
        let oneSquareFront;
        let twoSquaresFront;
        let targetRankForJumping;

        //****** transfer to data structure
        //calculate destination squares based on color 
        switch (this.color) {
            case E_PieceColor.White:
                rightDiagonalSquare = (this.position << 7n);
                leftDiagonalSquare = (this.position << 9n);
                oneSquareFront = (this.position << 8n);
                twoSquaresFront = (this.position << 16n);
                targetRankForJumping = 4;
                break;
            case E_PieceColor.Black:
                rightDiagonalSquare = (this.position >> 9n);
                leftDiagonalSquare = (this.position >> 7n);
                oneSquareFront = (this.position >> 8n);
                twoSquaresFront = (this.position >> 16n);
                targetRankForJumping = 5;
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        //calculate capture moves
        let rightCapture = rightDiagonalSquare &
            board.GetSpacesWithPieces(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.GetFile(1); //remove right capture from 8th file to 1st file

        let leftCapture = leftDiagonalSquare &
            board.GetSpacesWithPieces(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.GetFile(8); //remove right capture from 1st file to 8th file

        //calculate front move
        let frontMove = oneSquareFront &
            board.GetEmptySpaces(); //target square is empty

        //calculate front jump
        let frontJump = twoSquaresFront &
            GetBooleanBitboard(frontMove > 1) & //a front move is possible
            board.GetEmptySpaces() & //target square is empty 
            Board.GetRank(targetRankForJumping); //pawn can only jump from their initial rank

        return rightCapture | leftCapture | frontMove | frontJump;
    }
}