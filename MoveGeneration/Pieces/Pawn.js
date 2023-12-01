class Pawn extends Piece {

    GetType() {
        return E_PieceType.Pawn;
    }

    GetMoves(board) {
        let diagonalSquare
        let antiDiagonalSquare;
        let oneSquareFront;
        let twoSquaresFront;

        switch (this.color) {
            case E_PieceColor.White:
                diagonalSquare = (this.position << 7n);
                antiDiagonalSquare = (this.position << 9n);
                oneSquareFront = (this.position << 8n);
                twoSquaresFront = (this.position << 16n);
                break;
            case E_PieceColor.Black:
                diagonalSquare = (this.position >> 7n);
                antiDiagonalSquare = (this.position >> 9n);
                oneSquareFront = (this.position >> 8n);
                twoSquaresFront = (this.position >> 16n);
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        let rightCapture = diagonalSquare & board.GetPiecesOfColor(this.oppositeColor) & ~Board.GetRank(8) & ~Board.GetFile(1);
        let leftCapture = antiDiagonalSquare & board.GetPiecesOfColor(this.oppositeColor) & ~Board.GetRank(8) & ~Board.GetFile(8);
        let frontMove = oneSquareFront & board.GetEmptySpaces() & ~Board.GetFile(8);
        let frontJump = (frontMove > 1) & twoSquaresFront & board.GetEmptySpaces() & Board.GetRank(4);

        return rightCapture | leftCapture | frontMove | frontJump;
    }
}