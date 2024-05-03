class SlidingPiece extends Piece {

    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    getSlidingRays() {
        throw new Error("Method 'GetType()' must be implemented.");
    }
    /**
     * 
     * @param {BoardImplementation} board 
     * @returns Array of legal moves
     */
    GetMoves(board) {

        //Moves calculated using o^(o-2r) trick. 
        //Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.

        let occupied = board.getOccupied();
        let rays = this.getSlidingRays();
        let position = this.position;
        let slidingMoves = 0n;

        rays.forEach(ray => {
            let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
            slidingMoves = slidingMoves | movesInRay.wholeRay;
        });
        return slidingMoves & ~board.getOccupied(this.color);
    }
}