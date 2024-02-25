class Queen extends SlidingPiece {

    GetType() {
        return E_PieceType.Queen;
    }

    GetSlidingMasks() {
        return [Board.GetRank(this.rank),
        Board.GetFile(this.file),
        Board.GetDiagonal(this.rank, this.file),
        Board.GetAntiDiagonal(this.rank, this.file)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}