class MoveInputUI {
    #UIQuadrille;
    #colorForSelectedSquare = color(100, 100);
    #moveCompleted = false;
    #board;

    /**
     * 
     * @param {Quadrille} board 
     */
    constructor(board) {
        this.#UIQuadrille = createQuadrille(board.width, board.height);
        this.#board = board;
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.SquareSelected, this.#onSquareSelected.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, this.#onMoveInput.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveCanceled, this.#onMoveCanceled.bind(this));
    }

    #onMoveInput(event) {
        let result = isMoveLegal(event.detail.move);
        if (!result.isLegal) {
            this.#Clear();
        }
        this.#moveCompleted = true;
    }

    #onMoveCanceled(event) {
        this.#Clear();
    }

    #onSquareSelected(event) {
        if (this.#moveCompleted) {
            this.#Clear();
            this.#moveCompleted = false;
        }
        let square = event.detail.square;
        let row = 8 - square.rank;
        let column = square.file - 1;
        this.#UIQuadrille.fill(row, column, this.#colorForSelectedSquare);
    }

    #Clear() {
        this.#UIQuadrille.replace(this.#colorForSelectedSquare, null);
    }

    draw() {
        drawQuadrille(this.#UIQuadrille);
    }
}