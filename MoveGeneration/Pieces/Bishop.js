class Bishop extends SlidingPiece {

    GetType() {
        return E_PieceType.Bishop;
    }

    getSlidingRays() {
        return [Board.getDiagonal(this.rank, this.file), Board.getAntiDiagonal(this.rank, this.file)];
    }


    GetMoves(board) {
        return super.GetMoves(board);
    }
}