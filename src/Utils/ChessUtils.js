import { E_PieceColor } from "../Enums/E_PieceColor.js";
import { E_PieceType } from "../Enums/E_PieceType.js";
import { assert, assertPieceColor, assertPieceType, assertPieceKey, assertFile } from "../../Testing/TestTools.js";
import Move from "../MoveGeneration/Move.js";
import { E_CastlingSide } from "../Enums/E_CastlingSide.js";

export const NUMBER_OF_RANKS = 8;
export const NUMBER_OF_FILES = 8;

/**
 * Files involved in castling. Provide castling side and piece which is moving (rook or king)
 */
export const CASTLING_FILES = {
    [E_CastlingSide.QueenSide]: {
        [E_PieceType.King]: {
            startFile: 5,
            endFile: 3
        },
        [E_PieceType.Rook]: {
            startFile: 1,
            endFile: 4
        },
    },
    [E_CastlingSide.KingSide]: {
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

/**
 * Ranks where pawns can promote. Provide color
 */
export const RANKS_TO_PROMOTE = {
    [E_PieceColor.White]: 7,
    [E_PieceColor.Black]: 2
}

/**
 * Ranks where pawns can perform an en-passant capture. Provide color
 */
export const ENPASSANT_CAPTURING_RANKS = {
    [E_PieceColor.White]: 5,
    [E_PieceColor.Black]: 4
}

export const PIECE_TYPES_TO_PROMOTE = [
    E_PieceType.Bishop,
    E_PieceType.Knight,
    E_PieceType.Queen,
    E_PieceType.Rook
]

/**
 * 
 * @param {E_PieceColor} pieceColor 
 * @returns Opposite color of given piece color
 */
export function OppositePieceColor(pieceColor) {
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
 * Provide type to return lowercase piece key
 */
const PIECE_KEYS_BY_TYPE = {
    [E_PieceType.King]: 'k',
    [E_PieceType.Bishop]: 'b',
    [E_PieceType.Knight]: 'n',
    [E_PieceType.Queen]: 'q',
    [E_PieceType.Pawn]: 'p',
    [E_PieceType.Rook]: 'r'
}

/**
 * Provide piece key in lowercase to return piece type
 */
const PIECE_TYPE_BY_KEY = {
    'k': E_PieceType.King,
    'b': E_PieceType.Bishop,
    'n': E_PieceType.Knight,
    'q': E_PieceType.Queen,
    'p': E_PieceType.Pawn,
    'r': E_PieceType.Rook
}

/**
 * Transforms piece color and type to piece key
 * @param {E_PieceColor} pieceColor 
 * @param {E_PieceType} pieceType 
 * @returns piece key
 */
export function pieceColorTypeToKey(pieceColor, pieceType) {
    assertPieceColor(pieceColor);
    assertPieceType(pieceType);

    assert(pieceColor !== E_PieceColor.Any, "No piece color provided");
    assert(pieceType !== E_PieceType.Any, "No piece type provided");

    let pieceString = PIECE_KEYS_BY_TYPE[pieceType];

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
export function pieceKeyToColor(pieceKey) {
    assertPieceKey(pieceKey);
    let color = pieceKey == pieceKey.toUpperCase() ? E_PieceColor.White : E_PieceColor.Black;
    return color;
}

/**
 * Transforms a piece key into its type
 * @param {string} pieceKey 
 * @returns Piece type
 */
export function pieceKeyToType(pieceKey) {
    assertPieceKey(pieceKey);
    return PIECE_TYPE_BY_KEY[pieceKey.toLowerCase()];
}

/**
 * Converts a file number into its letter representation
 * @param {number} file 
 * @returns 
 */
export function FileToLetter(file) {
    assertFile(file);
    return String.fromCharCode(96 + file);
}

/**
 * 
 * @param {Move} move 
 * @returns move in algebraic notation
 */
export function MoveToString(move) {
    assert(move instanceof Move, "Invalid move")
    let startFileLetter = FileToLetter(move.startFile);
    let endFileLetter = FileToLetter(move.endFile);
    return startFileLetter + move.startRank + endFileLetter + move.endRank;
}


