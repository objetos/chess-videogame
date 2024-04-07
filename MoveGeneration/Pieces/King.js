class King extends Piece {
    #attackMask = 0x70507n;

    GetType() {
        return E_PieceType.King;
    }
    /**
     * 
     * @param {Board} board 
     * @returns 
     */
    GetMoves(board) {
        //calculate current square
        let currentSquare = (this.rank - 1) * 8 + (9 - this.file);
        let moves = 0n;

        //displace attack mask to current square
        if (10 <= currentSquare) {
            moves = this.#attackMask << BigInt(currentSquare - 10);
        } else {
            moves = this.#attackMask >> BigInt(10 - currentSquare);
        }

        //remove bits that "wrapped around" the sides
        if (this.file < 3) {
            moves = moves & ~Board.getFile(7) & ~Board.getFile(8);
        } else if (6 < this.file) {
            moves = moves & ~Board.getFile(1) & ~Board.getFile(2);
        }
        //remove pieces of same color
        moves = moves & ~board.getOccupied(this.color);

        return moves;
    }

    isOnInitialSquare() {
        return this.color === E_PieceColor.White ?
            (this.rank === 1 && this.file === 5) :
            (this.rank === 8 && this.file === 5);
    }
}