class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    getSlidingRays() {
        return [getRank(this.rank),
        getFile(this.file),
        getDiagonal(this.rank, this.file),
        getAntiDiagonal(this.rank, this.file)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}