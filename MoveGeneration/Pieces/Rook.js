class Rook extends SlidingPiece {

    GetType() {
        return E_PieceType.Rook;
    }

    GetSlidingMasks() {
        return [Board.GetFile(this.file), Board.GetRank(this.rank)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}