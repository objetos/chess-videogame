//class prolog, assertions in constructor
class Move {
    #startRank;
    #startFile;
    #endRank;
    #endFile;
    #flag;

    constructor(startRank, startFile, endRank, endFile, flag = E_MoveFlag.None) {

        this.#assertMove(startRank, startFile, endRank, endFile, flag);

        this.#startRank = startRank;
        this.#startFile = startFile;
        this.#endRank = endRank;
        this.#endFile = endFile;
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
