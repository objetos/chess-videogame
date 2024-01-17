class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    GetSlidingMasks() {
        let antiDiagonalNumber = this.file + this.rank - 1;
        let diagonalNumber = (9 - this.file) + this.rank - 1;

        return [Board.GetRank(this.rank), Board.GetFile(this.file), Board.GetDiagonal(diagonalNumber), Board.GetAntiDiagonal(antiDiagonalNumber)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}