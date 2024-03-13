class Rook extends SlidingPiece {

    GetType() {
        return E_PieceType.Rook;
    }

    getSlidingRays() {
        return [Board.getFile(this.file), Board.getRank(this.rank)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }
}