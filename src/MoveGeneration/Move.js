//class prolog
import { assert, assertRank, assertFile } from "../../Testing/TestTools.js";
import { E_MoveFlag } from "../Enums/E_MoveFlag.js";

export default class Move {
    #startRank;
    #startFile;
    #endRank;
    #endFile;
    #flag;

    /**
     * Creates a new move
     * @param {number} startRank 
     * @param {number} startFile 
     * @param {number} destinationRank 
     * @param {number} destinationFile 
     * @param {E_MoveFlag} flag 
     */
    constructor(startRank, startFile, destinationRank, destinationFile, flag = E_MoveFlag.None) {

        this.#assertMove(startRank, startFile, destinationRank, destinationFile, flag);

        this.#startRank = startRank;
        this.#startFile = startFile;
        this.#endRank = destinationRank;
        this.#endFile = destinationFile;
        this.#flag = flag;
    }

    get startRank() {
        return this.#startRank;
    }

    get startFile() {
        return this.#startFile;
    }

    get endRank() {
        return this.#endRank;
    }

    get endFile() {
        return this.#endFile;
    }

    get flag() {
        return this.#flag;
    }

    #assertMove(startRank, startFile, endRank, endFile, flag) {
        assertRank(startRank);
        assertRank(endRank);
        assertFile(startFile);
        assertFile(endFile);
        assert(!((startRank === endRank) && (startFile === endFile)), "Invalid move. Start and destination squares are the same");
    }
}
