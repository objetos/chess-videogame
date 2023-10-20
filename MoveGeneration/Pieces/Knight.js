class Knight extends Piece {

    GetType() {
        return E_PieceType.Knight;
    }

    GetMoves(board) {
        super.GetMoves(board);
    }

    ToString() {
        return super.ToString().replace("K", "k");
    }
}