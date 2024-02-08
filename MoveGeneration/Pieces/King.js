class King extends Piece {
    #attackMask = 0x70507n;
    #hasChangedPosition = false;
    #instantiatedOnInitialSquare;

    constructor(color, rank, file) {
        super(color, rank, file);
        switch (this.color) {
            case E_PieceColor.White:
                this.#instantiatedOnInitialSquare = (rank === 1 && file === 5);
                break;
            case E_PieceColor.Black:
                this.#instantiatedOnInitialSquare = (rank === 8 && file === 5);
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }
    }

    GetType() {
        return E_PieceType.King;
    }
    /**
     * 
     * @param {BoardImplementation} board 
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
            moves = moves & ~BoardImplementation.GetFile(7) & ~BoardImplementation.GetFile(8);
        } else if (6 < this.file) {
            moves = moves & ~BoardImplementation.GetFile(1) & ~BoardImplementation.GetFile(2);
        }
        //remove pieces of same color
        moves = moves & ~board.GetSpacesWithPieces(this.color, E_PieceType.Any);

        return moves;
    }

    SetPosition(rank, file) {
        super.SetPosition(rank, file);
        this.#hasChangedPosition = true;
    }

    get hasMoved() {
        return this.#hasChangedPosition || !this.#instantiatedOnInitialSquare;
    }

}