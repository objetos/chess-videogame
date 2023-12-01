class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    GetSlidingMask() {
        let antiDiagonalNumber = this.file + this.rank - 1;
        let diagonalNumber = (9 - this.file) + this.rank - 1;

        return Board.GetRank() | Board.GetFile() | Board.GetDiagonal(diagonalNumber) | Board.GetAntiDiagonal(antiDiagonalNumber);
    }

    GetMoves(board) {
        super.GetMoves(board);
    }
}