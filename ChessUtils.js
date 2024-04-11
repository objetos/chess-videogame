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

/**
 * 
 * @param {E_PieceColor} pieceColor 
 * @returns Opposite color of given piece color
 */
function OppositePieceColor(pieceColor) {
    assertPieceColor(pieceColor);
    switch (pieceColor) {
        case E_PieceColor.White:
            return E_PieceColor.Black;
        case E_PieceColor.Black:
            return E_PieceColor.White;
        default:
            throw Error("No color specified");
    }
}

/**
 * Transforms piece color a type to piece key
 * @param {E_PieceColor} pieceColor 
 * @param {E_PieceType} pieceType 
 * @returns piece key
 */
function pieceColorTypeToKey(pieceColor, pieceType) {
    assertPieceColor(pieceColor);
    assertPieceType(pieceType);

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

/**
 * Transforms a piece key into its color
 * @param {string} pieceKey 
 * @returns Piece color
 */
function pieceKeyToColor(pieceKey) {
    assertPieceKey(pieceKey);
    let color = pieceKey == pieceKey.toUpperCase() ? E_PieceColor.White : E_PieceColor.Black;
    return color;
}

/**
 * Transforms a piece key into its type
 * @param {string} pieceKey 
 * @returns Piece type
 */
function pieceKeyToType(pieceKey) {
    assertPieceKey(pieceKey);
    let type;
    switch (pieceKey.toUpperCase()) {
        case 'K':
            type = E_PieceType.King;
            break;
        case 'Q':
            type = E_PieceType.Queen;
            break;
        case 'B':
            type = E_PieceType.Bishop;
            break;
        case 'R':
            type = E_PieceType.Rook;
            break;
        case 'N':
            type = E_PieceType.Knight;
            break;
        case 'P':
            type = E_PieceType.Pawn;
            break;
        default:
            throw new Error("Incorrect piece type:" + pieceKey);
    }

    return type;
}

function assertPieceKey(pieceKey) {
    assert(Object.values(Quadrille.chessKeys).includes(pieceKey), "Invalid piece key");
}

/**
 * Converts a file number into its letter representatio 
 * @param {number} file 
 * @returns 
 */
function FileToLetter(file) {
    assertFile(file);
    return String.fromCharCode(96 + file);
}
