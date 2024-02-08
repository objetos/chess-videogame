class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    GetSlidingMasks() {
        let antiDiagonalNumber = this.file + this.rank - 1;
        let diagonalNumber = (9 - this.file) + this.rank - 1;

        return [BoardImplementation.GetRank(this.rank), BoardImplementation.GetFile(this.file), BoardImplementation.GetDiagonal(diagonalNumber), BoardImplementation.GetAntiDiagonal(antiDiagonalNumber)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}