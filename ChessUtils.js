const CASTLING_FILES = {//******  method?
    [E_MoveFlag.QueenSideCastling]: {
        [E_PieceType.King]: {
            startFile: 5,
            endFile: 3
        },
        [E_PieceType.Rook]: {
            startFile: 1,
            endFile: 4
        },
    },
    [E_MoveFlag.KingSideCastling]: {
        [E_PieceType.King]: {
            startFile: 5,
            endFile: 7
        },
        [E_PieceType.Rook]: {
            startFile: 8,
            endFile: 6
        }
    }
}

const RANKS_TO_PROMOTE = {
    [E_PieceColor.White]: 7,
    [E_PieceColor.Black]: 2
}

const ENPASSANT_CAPTURING_RANKS = {
    [E_PieceColor.White]: 5,
    [E_PieceColor.Black]: 4
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
function colorTypeToString(pieceColor, pieceType) {
    let pieceString = '';
    switch (pieceType) {
        case E_PieceType.King:
            pieceString = 'k';
            break;
        case E_PieceType.Bishop:
            pieceString = 'b';
            break;
        case E_PieceType.Knight:
            pieceString = 'n';
            break;
        case E_PieceType.Queen:
            pieceString = 'q';
            break;
        case E_PieceType.Pawn:
            pieceString = 'p';
            break;
        case E_PieceType.Rook:
            pieceString = 'r';
            break;
        default:
            throw new Error("Incorrect piece type:" + piece);
    }

    if (pieceColor === E_PieceColor.White) {
        pieceString = pieceString.toUpperCase();
    }

    return pieceString;
}