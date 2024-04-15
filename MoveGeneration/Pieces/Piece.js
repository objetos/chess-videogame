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

        assert(Object.values(E_PieceColor).includes(color), "Piece color not defined");
        assertRank(rank);
        assertFile(file);

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
     * @param {BoardImplementation} board 
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

