/*
****** class prolog
*/
class Piece {
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

        console.assert(Object.values(E_PieceColor).includes(color), "Piece color not defined");
        console.assert(typeof file === "number", "File Invalid");
        console.assert(file >= 1 && file <= 8, "File " + file + " is out of bounds.");
        console.assert(typeof rank === "number", "Rank Invalid");
        console.assert(rank >= 1 && rank <= 8, "File " + rank + " is out of bounds.");

        this.#color = color;
        this.#rank = rank;
        this.#file = file;

        this.#position = RankFileToBitboard(rank, file);
        this.#rank = rank;
        this.#file = file;
    }

    get position() {
        return this.#position;
    }

    SetPosition(rank, file) {
        //****** assertions, test
        //move to rank
        this.#position = 1n << BigInt(8 - file);
        this.#rank = rank;
        //move to file
        this.#position = this.#position << BigInt((rank - 1) * 8);
        this.#file = file;
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

    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

    /**
     * Returns bitboard that contains legal positions this piece can move to
     * @param {Board} board 
     */
    GetMoves(board) {
        throw new Error("Method 'GetMoves()' must be implemented.");
    }

    IsSlider() {
        return this instanceof SlidingPiece;
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

