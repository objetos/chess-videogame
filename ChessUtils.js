const CASTLING_FILES = {//******  change array for smth else
    [E_MoveFlag.QueenSideCastling]: {
        [E_PieceType.King]: [5, 3],
        [E_PieceType.Rook]: [1, 4]
    },
    [E_MoveFlag.KingSideCastling]: {
        [E_PieceType.King]: [5, 7],
        [E_PieceType.Rook]: [8, 6]
    }
}

function OppositePieceColor(color) {
    switch (color) {
        case E_PieceColor.White:
            return E_PieceColor.Black;
        case E_PieceColor.Black:
            return E_PieceColor.White;
        default:
            throw Error("No color specified");
    }
}