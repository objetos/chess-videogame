class SlidingPiece extends Piece {

    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    GetSlidingMask() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    GetMoves(board) {
        let occupied = board.GetOccupied();
        let mask = this.GetSlidingMask();
        let occupiedInMask = occupied & mask;
        let position = this.position;

        let slidingMoves = ((occupiedInMask - 2 * position) ^ Reverse((Reverse(occupiedInMask) - 2 * Reverse(position)))) & mask;
        return slidingMoves & !board.GetPiecesOfColor(this.color);
    }
}