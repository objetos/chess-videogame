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

    isOnInitialSquare() {
        return this.color === E_PieceColor.White ?
            (this.rank === 1 && this.file === 1) | (this.rank === 1 && this.file === 8) :
            (this.rank === 8 && this.file === 1) | (this.rank === 8 && this.file === 8);
    }
}