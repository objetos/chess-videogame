/*
****** class prolog
*/
import { E_PieceColor } from "../../Enums/E_PieceColor.js";
import { E_PieceType } from "../../Enums/E_PieceType.js";
import { assertRank, assertFile, assertPieceColor } from "../../../Testing/TestTools.js";
import { squareToBitboard } from "../../Utils/BitboardUtils.js";
export default class Piece {
    #color = E_PieceColor.None;
    #rank = 0;
    #file = 0;
    #position = 0;

    /**
     * Creates new piece object
     * 
     * @param {E_PieceColor} color Color of piece.
     * @param {number} file File of piece's position.
     * @param {number} rank Rank of piece's position.
     */
    constructor(color, rank, file) {
        if (this.constructor === Piece) {
            console.log(constructor);
            throw new Error("Abstract classes can't be instantiated.");
        }

        assertPieceColor(color);
        assertRank(rank);
        assertFile(file);

        this.#color = color;
        this.#rank = rank;
        this.#file = file;

        this.#position = squareToBitboard(rank, file);
        this.#rank = rank;
        this.#file = file;
    }

    get position() {
        return this.#position;
    }

    get color() {
        return this.#color;
    }

    get rank() {
        return this.#rank;
    }

    get file() {
        return this.#file;
    }

    /**
     * @returns {E_PieceType} Type of piece
     */
    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    /**
     * Returns bitboard that contains legal positions this piece can move to
     * @param {BoardImplementation} board 
     */
    GetMoves(board) {
        throw new Error("Method 'GetMoves()' must be implemented.");
    }

    IsSlider() {
        return false;
    }

    toString() {
        let typeString = this.GetType().toString();

        if (this.GetType() === E_PieceType.Knight) {
            typeString = typeString.charAt(8);
        } else {
            typeString = typeString.charAt(7);
        }

        if (this.#color === E_PieceColor.Black) {
            typeString = typeString.toLowerCase();
        } else {
            typeString = typeString.toUpperCase();
        }

        return typeString;
    }
}