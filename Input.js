class Input {
    static #pieceSelectedForPromotion = E_PieceType.Queen;

    static get pieceSelectedForPromotion() {
        return this.#pieceSelectedForPromotion;
    }

    static set pieceSelectedForPromotion(value) {
        console.assert(Object.values(E_PieceType).includes(value), "Piece type not defined");
        console.assert(value !== E_PieceType.Pawn, "Promotion to Pawn is forbidden");
        console.assert(value !== E_PieceType.King, "Promotion to King is forbidden");
        this.#pieceSelectedForPromotion = value;
    }
}