class Knight extends Piece {
    #attackMask = 0xA1100110An;

    GetType() {
        return E_PieceType.Knight;
    }
    /**
     * 
     * @param {BoardImplementation} board 
     * @returns 
     */
    GetMoves(board) {
        //calculate current square
        let currentSquare = (this.rank - 1) * NUMBER_OF_FILES + (NUMBER_OF_FILES - this.file + 1);
        let moves = 0n;

        //displace attack mask to current square
        if (19 <= currentSquare) {
            moves = this.#attackMask << BigInt(currentSquare - 19);
        } else {
            moves = this.#attackMask >> BigInt(19 - currentSquare);
        }

        //remove bits that "wrapped around" the sides
        if (this.file < 3) {
            moves = moves & ~getFile(7) & ~getFile(8);
        } else if (6 < this.file) {
            moves = moves & ~getFile(1) & ~getFile(2);
        }
        //remove pieces of same color
        moves = moves & ~board.getOccupied(this.color);

        return moves;
    }

    ToString() {
        return super.ToString().replace("K", "N");
    }
}