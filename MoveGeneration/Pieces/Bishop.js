class Bishop extends SlidingPiece {

    GetType() {
        return E_PieceType.Bishop;
    }

    getSlidingRays() {
        return [getDiagonal(this.rank, this.file), getAntiDiagonal(this.rank, this.file)];
    }


    GetMoves(board) {
        return super.GetMoves(board);
    }
}