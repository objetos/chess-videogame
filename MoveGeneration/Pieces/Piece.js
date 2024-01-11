/*
****** class prolog, document interface
*/
class Piece {
    #color = E_PieceColor.None;
    #oppositeColor = E_PieceColor.None;
    #rank = 0;
    #file = 0;
    #position = 0;

    /**
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
        console.assert(typeof file === "number", "File is of incorrect type");
        console.assert(file >= 1 && file <= 8, "File " + file + " is out of bounds.");
        console.assert(typeof rank === "number", "Rank is of incorrect type");
        console.assert(rank >= 1 && rank <= 8, "File " + rank + " is out of bounds.");

        this.#color = color;
        switch (color) {
            case E_PieceColor.White:
                this.#oppositeColor = E_PieceColor.Black;
                break;
            case E_PieceColor.Black:
                this.#oppositeColor = E_PieceColor.White;
                break;
            case E_PieceColor.None:
                throw new Error("No color specified");
            default:
                throw new Error("No color specified");
        }

        this.#rank = rank;
        this.#file = file;

        //move to rank
        this.#position = 1n << BigInt(8 - file);
        //move to file
        this.#position = this.#position << BigInt((rank - 1) * 8);
    }

    get position() {
        return this.#position;
    }

    SetPosition(rank, file) {
        //****** assertions
    }

    get color() {
        return this.#color;
    }

    // ****** method in piece?
    get oppositeColor() {
        return this.#oppositeColor;
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

    ToString() {
        let colorString = this.#color.toString();
        colorString = colorString.charAt(7);
        let typeString = this.GetType().toString();
        typeString = typeString.charAt(7);
        return colorString + typeString;
    }
}

