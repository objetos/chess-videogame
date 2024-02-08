//class prolog, assertions in constructor
class Move {
    #startRank;
    #startFile;
    #endRank;
    #endFile;
    #flag;

    constructor(startRank, startFile, endRank, endFile, flag = E_MoveFlag.Regular) {
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

}
