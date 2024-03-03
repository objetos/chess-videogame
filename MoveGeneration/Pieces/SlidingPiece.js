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
     * @returns Array of legal moves
     */
    GetMoves(board) {

        //Moves calculated using o^(o-2r) trick. 
        //Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.

        let occupied = board.getOccupied();
        let masks = this.GetSlidingMasks();
        let position = this.position;
        let slidingMoves = 0n;

        masks.forEach(mask => {
            let moveRays = HyperbolaQuintessenceAlgorithm(occupied, position, mask);
            slidingMoves = slidingMoves | moveRays[0] | moveRays[1];
        });
        return slidingMoves & ~board.getOccupied(this.color, E_PieceType.Any);
    }
}