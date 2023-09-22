/*
****** class prolog


*/
class Piece {
    #type = 0;
    #color = 0;
    #rank = 0;
    #file = 0;
    #position = 0;

    constructor(color, rank, file) {
        //****** assertions
        if (this.constructor === Piece) {
            console.log(constructor);
            throw new Error("Abstract classes can't be instantiated.");
        }
        this.#color = color;
        this.#rank = rank;
        this.#file = file;
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
        return this.#type;
    }

    GetMoves(board) {
        throw new Error("Method 'GetMoves()' must be implemented.");
    }
}

