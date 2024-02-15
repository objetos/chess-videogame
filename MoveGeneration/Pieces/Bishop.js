class Bishop extends SlidingPiece {

    GetType() {
        return E_PieceType.Bishop;
    }

    GetSlidingMasks() {
        let antiDiagonalNumber = this.file + this.rank - 1;
        let diagonalNumber = (9 - this.file) + this.rank - 1;

        return [Board.GetDiagonal(diagonalNumber), Board.GetAntiDiagonal(antiDiagonalNumber)];
    }


    GetMoves(board) {
        return super.GetMoves(board);
    }
}