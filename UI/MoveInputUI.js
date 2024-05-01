//****** document class, test
class MoveInputUI {
    #UIQuadrille;
    #colorForSelectedSquare = color(100, 100);
    #colorForAvailableMoves = color(179, 255, 179);
    #moveCompleted = false;

    constructor() {
        this.#UIQuadrille = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveStartSet, this.#onMoveStartSet.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveDestinationSet, this.#onMoveDestinationSet.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, this.#onMoveInput.bind(this));
        MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveCanceled, this.#onMoveCanceled.bind(this));
    }

    #onMoveStartSet(event, board) {
        if (this.#moveCompleted) {
            this.#Clear();
            this.#moveCompleted = false;
        }
        let square = event.detail.square;
        this.#fillSquare(square.rank, square.file, this.#colorForSelectedSquare);
        for (let move of legalMoves) {
            if (move.startRank === square.rank && move.startFile === square.file) {
                this.#fillSquare(move.endRank, move.endFile, this.#colorForAvailableMoves);
            }
        }
    }

    #onMoveDestinationSet(event) {
        this.#fillSquare(event.detail.square.rank, event.detail.square.file, this.#colorForSelectedSquare);
    }

    #fillSquare(rank, file, color) {
        let row = 8 - rank;
        let column = file - 1;
        this.#UIQuadrille.fill(row, column, color);
    }

    #onMoveInput(event) {
        let result = isMoveLegal(event.detail.move);
        if (!result.isLegal) {
            this.#Clear();
        } else {
            this.#UIQuadrille.replace(this.#colorForAvailableMoves, null);
        }
        this.#moveCompleted = true;
    }

    #onMoveCanceled(event) {
        this.#Clear();
    }

    #Clear() {
        this.#UIQuadrille.clear();
    }

    draw() {
        drawQuadrille(this.#UIQuadrille, { x: BOARD_POSITION.x, y: BOARD_POSITION.y });
    }
}