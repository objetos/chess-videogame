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
            moves = this.#attackMask << (currentSquare - newLocal);
        } else {
            moves = this.#attackMask >> (19 - currentSquare);
        }

        //remove bits that "wrapped around" the sides
        if (this.file < 3) {
            moves = moves & !Board.GetFile(1) & !Board.GetFile(2);
        } else if (6 < this.file) {
            moves = moves & !Board.GetFile(7) & !Board.GetFile(8);
        }
        //remove pieces of same color
        moves = moves & !board.GetPiecesOfColor(this.color);

        return moves;
    }

    ToString() {
        return super.ToString().replace("K", "N");
    }
}