class SlidingPiece extends Piece {

    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    GetSlidingMasks() {
        throw new Error("Method 'GetType()' must be implemented.");
    }
    /**
     * 
     * @param {Board} board 
     * @returns 
     */
    GetMoves(board) {
        let occupied = board.GetOccupied();
        let masks = this.GetSlidingMasks();
        let position = this.position;
        let slidingMoves = 0n;

        masks.forEach(mask => {
            let blockers = occupied & mask;
            let positiveRayMoves = ((blockers - 2n * position) ^ occupied) & mask;
            let negativeRayMoves = (Reverse((Reverse(blockers) - 2n * Reverse(position))) ^ occupied) & mask;
            slidingMoves = slidingMoves | positiveRayMoves | negativeRayMoves;
        });
        return slidingMoves & ~board.GetPiecesOfColor(this.color);
    }
}