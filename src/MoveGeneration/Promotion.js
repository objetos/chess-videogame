import { assert, assertPieceType } from "../../Testing/TestTools.js";
import { E_MoveFlag } from "../Enums/E_MoveFlag.js";
import { E_PieceType } from "../Enums/E_PieceType.js";
import Move from "./Move.js";

export default class Promotion extends Move {
    #newPieceType;
    constructor(startRank, startFile, destinationRank, destinationFile) {
        super(startRank, startFile, destinationRank, destinationFile, E_MoveFlag.Promotion);
        this.#newPieceType = E_PieceType.Queen;
    }

    get newPieceType() {
        assert(this.#newPieceType !== undefined, "No piece set for promotion");
        return this.#newPieceType;
    }

    set newPieceType(pieceType) {
        assertPieceType(pieceType);
        this.#newPieceType = pieceType;
    }
}