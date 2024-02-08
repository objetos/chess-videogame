class Knight extends Piece {
    #attackMask = 0xA1100110An;

    GetType() {
        return E_PieceType.Knight;
    }

    GetMoves(board) {
        //calculate current square
        let currentSquare = (this.rank - 1) * 8 + (9 - this.file);
        let moves = 0n;

        //displace attack mask to current square
        if (19 <= currentSquare) {
            moves = this.#attackMask << BigInt(currentSquare - 19);
        } else {
            moves = this.#attackMask >> BigInt(19 - currentSquare);
        }

        //remove bits that "wrapped around" the sides
        if (this.file < 3) {
            moves = moves & ~BoardImplementation.GetFile(7) & ~BoardImplementation.GetFile(8);
        } else if (6 < this.file) {
            moves = moves & ~BoardImplementation.GetFile(1) & ~BoardImplementation.GetFile(2);
        }
        //remove pieces of same color
        moves = moves & ~board.GetSpacesWithPieces(this.color, E_PieceType.Any);

        return moves;
    }

    ToString() {
        return super.ToString().replace("K", "N");
    }
}