class Rook extends SlidingPiece {

    GetType() {
        return E_PieceType.Rook;
    }

    GetSlidingMask() {
        return Board.GetRank(this.rank) | Board.GetFile(this.file);
    }

    GetMoves(board) {
        super.GetMoves(board);
    }
}