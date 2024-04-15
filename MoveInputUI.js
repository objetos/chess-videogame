class MoveInputUI {
    #UIQuadrille;
    #colorForSelectedSquare = color(100, 100);
    #moveCompleted = false;

    constructor() {
        this.#UIQuadrille = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveStartSet, this.#onMoveStartSet.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveDestinationSet, this.#onMoveDestinationSet.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, this.#onMoveInput.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveCanceled, this.#onMoveCanceled.bind(this));
    }

    #onMoveStartSet(event) {
        if (this.#moveCompleted) {
            this.#Clear();
            this.#moveCompleted = false;
        }
        this.#fillSquare(event.detail.square);
    }

    #onMoveDestinationSet(event) {
        this.#fillSquare(event.detail.square);
    }

    #fillSquare(square) {
        let row = 8 - square.rank;
        let column = square.file - 1;
        this.#UIQuadrille.fill(row, column, this.#colorForSelectedSquare);
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

    #Clear() {
        this.#UIQuadrille.replace(this.#colorForSelectedSquare, null);
    }

    draw() {
        drawQuadrille(this.#UIQuadrille, { x: BOARD_POSITION.x, y: BOARD_POSITION.y });
    }
}