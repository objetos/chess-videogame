class Pawn extends Piece {

    GetType() {
        return E_PieceType.Pawn;
    }

    GetMoves(board) {
        let diagonalSquare;
        let antiDiagonalSquare;
        let oneSquareFront;
        let twoSquaresFront;
        let targetRankForJumping;

        //calculate destination squares based on color
        switch (this.color) {
            case E_PieceColor.White:
                diagonalSquare = (this.position << 7n);
                antiDiagonalSquare = (this.position << 9n);
                oneSquareFront = (this.position << 8n);
                twoSquaresFront = (this.position << 16n);
                targetRankForJumping = 4;
                break;
            case E_PieceColor.Black:
                diagonalSquare = (this.position >> 7n);
                antiDiagonalSquare = (this.position >> 9n);
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
        let rightCapture = diagonalSquare &
            board.GetSpacesWithPieces(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.GetRank(1); //remove right capture from 8th rank to 1st rank

        let leftCapture = antiDiagonalSquare &
            board.GetSpacesWithPieces(OppositePieceColor(this.color), E_PieceType.Any) & //There's an enemy piece in that square
            ~Board.GetRank(8); //remove right capture from 1st rank to 8th rank

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