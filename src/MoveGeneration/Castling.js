import Move from "./Move.js";
import { E_MoveFlag } from "../Enums/E_MoveFlag.js";
import { assert } from "../../Testing/TestTools.js";
import { E_CastlingSide } from "../Enums/E_CastlingSide.js";

export default class Castling extends Move {
    #castlingSide;
    constructor(startRank, startFile, destinationRank, destinationFile, castlingSide = E_CastlingSide.None) {
        assert(Object.values(E_CastlingSide).includes(castlingSide), "Invalid castling side");
        assert(castlingSide !== E_CastlingSide.None, "No castling side provided");
        super(startRank, startFile, destinationRank, destinationFile, E_MoveFlag.Castling);
        this.#castlingSide = castlingSide;
    }

    get castlingSide() {
        return this.#castlingSide;
    }
}