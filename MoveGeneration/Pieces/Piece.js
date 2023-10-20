/*
****** class prolog


*/
class Piece {
    #color = E_PieceColor.None;
    #rank = 0;
    #file = 0;
    #position = 0;

    constructor(color, rank, file) {
        //****** assertions, test
        if (this.constructor === Piece) {
            console.log(constructor);
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.#color = color;
        this.#rank = rank;
        this.#file = file;

        //move to rank
        this.#position = 1n << BigInt(8 - file);
        //move to file
        this.#position = this.#position << BigInt((rank - 1) * 8);
    }

    GetPosition() {
        return this.#position;
    }

    SetPosition(rank, file) {
        //****** assertions
    }

    GetColor() {
        return this.#color;
    }

    GetType() {
        throw new Error("Method 'GetType()' must be implemented.");
    }

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

