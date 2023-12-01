class Knight extends Piece {
    #attackMask = 0xA1100110An;
    #maskSquare = ;

    GetType() {
        return E_PieceType.Knight;
    }

    GetMoves(board) {
        let maskDisplacement = this.rank * (9 - this.file);
        if (maskDisplacement >= 19) {

        } els
    }

    ToString() {
        return super.ToString().replace("K", "k");
    }
}