class Rook extends SlidingPiece {
    #hasChangedPosition = false;
    #instantiatedOnInitialSquare;

    constructor(color, rank, file) {
        super(color, rank, file);
        switch (this.color) {
            case E_PieceColor.White:
                this.#instantiatedOnInitialSquare = (rank === 1 && file === 1 || rank === 1 && file === 8);
                break;
            case E_PieceColor.Black:
                this.#instantiatedOnInitialSquare = (rank === 8 && file === 1 || rank === 8 && file === 8);
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }
    }

    GetType() {
        return E_PieceType.Rook;
    }

    GetSlidingMasks() {
        return [Board.getFile(this.file), Board.getRank(this.rank)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }

    SetPosition(rank, file) {
        super.SetPosition(rank, file);
        this.#hasChangedPosition = true;
    }

    get hasMoved() {
        return this.#hasChangedPosition || !this.#instantiatedOnInitialSquare;
    }
}