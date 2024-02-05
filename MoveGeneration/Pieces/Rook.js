class Rook extends SlidingPiece {
    #hasMoved = false;

    GetType() {
        return E_PieceType.Rook;
    }

    GetSlidingMasks() {
        return [Board.GetFile(this.file), Board.GetRank(this.rank)];
    }

    GetMoves(board) {
        return super.GetMoves(board);
    }

    SetPosition(rank, file) {
        super.SetPosition(rank, file);
        this.#hasMoved = true;
    }

    get hasMoved() {
        return this.#hasMoved;
    }
}