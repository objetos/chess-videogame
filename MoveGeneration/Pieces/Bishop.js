class Bishop extends SlidingPiece {

    GetType() {
        return E_PieceType.Bishop;
    }

    GetSlidingMasks() {
        return [Board.getDiagonal(this.rank, this.file), Board.getAntiDiagonal(this.rank, this.file)];
    }


    GetMoves(board) {
        return super.GetMoves(board);
    }
}