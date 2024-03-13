class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    getSlidingRays() {
        return [Board.getRank(this.rank),
        Board.getFile(this.file),
        Board.getDiagonal(this.rank, this.file),
        Board.getAntiDiagonal(this.rank, this.file)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}