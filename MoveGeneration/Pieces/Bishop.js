class Bishop extends SlidingPiece {

    GetType() {
        return E_PieceType.Bishop;
    }

    GetSlidingMasks() {
        return [Board.GetDiagonal(this.rank, this.file), Board.GetAntiDiagonal(this.rank, this.file)];
    }


    GetMoves(board) {
        return super.GetMoves(board);
    }
}