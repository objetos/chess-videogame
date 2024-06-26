import { E_PieceColor } from "../src/Enums/E_PieceColor.js";
import { E_PieceType } from "../src/Enums/E_PieceType.js";
import { NUMBER_OF_RANKS, NUMBER_OF_FILES } from "../src/Utils/ChessUtils.js";
const validPieceKeys = ['r', 'n', 'q', 'k', 'p', 'b', 'R', 'N', 'Q', 'K', 'P', 'B'];

export function assert(condition, message) {
    if (!condition) {
        let error = new Error();
        let stack = error.stack;
        let firstLineSkipIndex = stack.indexOf("\n");
        let secondLineSkipIndex = stack.indexOf("\n", firstLineSkipIndex + 2);
        let thisFunctionCall = stack.substring(firstLineSkipIndex, secondLineSkipIndex);
        stack = stack.replace(thisFunctionCall, "");
        console.log(stack);
        throw message || "Assertion failed";
    }
}

export function assertRank(rank) {
    assert(rank !== undefined, "No rank provided");
    assert(typeof rank === "number", "Rank Invalid");
    assert(Number.isInteger(rank), "Rank is not an integer");
    assert(rank >= 1 && rank <= NUMBER_OF_RANKS, "Rank " + rank + " is out of bounds.");

}

export function assertFile(file) {
    assert(file !== undefined, "No file provided");
    assert(typeof file === "number", "File Invalid");
    assert(Number.isInteger(file), "File is not an integer");
    assert(file >= 1 && file <= NUMBER_OF_FILES, "File " + file + " is out of bounds.");
}

export function assertPieceColor(pieceColor) {
    assert(Object.values(E_PieceColor).includes(pieceColor), "Invalid piece color");
    assert(pieceColor !== E_PieceColor.None, "No piece color provided");
}

export function assertPieceType(pieceType) {
    assert(Object.values(E_PieceType).includes(pieceType), "Invalid piece type");
    assert(pieceType !== E_PieceType.None, "No piece type provided");
}

export function assertPieceKey(pieceKey) {
    assert(Object.values(Quadrille.chessKeys).includes(pieceKey), "Invalid piece key");
}
