class King extends Piece {
    #attackMask = 0x70507n;

    GetType() {
        return E_PieceType.King;
    }

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
            moves = moves & ~Board.GetFile(7) & ~Board.GetFile(8);
        } else if (6 < this.file) {
            moves = moves & ~Board.GetFile(1) & ~Board.GetFile(2);
        }
        //remove pieces of same color
        moves = moves & ~board.GetPiecesOfColor(this.color);

        return moves;
    }

}