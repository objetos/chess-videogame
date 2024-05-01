//****** document class, test
class MoveInputUI {
    #game;
    #UIQuadrille;
    #colorForSelectedSquare = color(100, 100);
    #colorForAvailableMoves = color(179, 255, 179);
    #moveCompleted = false;

    /**
     * 
     * @param {Game} game 
     * @param {MoveInput} moveInput 
     */
    constructor(game, moveInput) {
        this.#game = game;
        this.#UIQuadrille = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        moveInput.addInputEventListener(MoveInput.E_InputEvents.MoveStartSet, this.#onMoveStartSet.bind(this));
        moveInput.addInputEventListener(MoveInput.E_InputEvents.MoveDestinationSet, this.#onMoveDestinationSet.bind(this));
        moveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, this.#onMoveInput.bind(this));
        moveInput.addInputEventListener(MoveInput.E_InputEvents.MoveCanceled, this.#onMoveCanceled.bind(this));
    }

    #onMoveStartSet(event) {
        if (this.#moveCompleted) {
            this.#Clear();
            this.#moveCompleted = false;
        }
        let square = event.detail.square;
        this.#fillSquare(square.rank, square.file, this.#colorForSelectedSquare);
        for (let move of this.#game.legalMoves) {
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
        let result = this.#game.isMoveLegal(event.detail.move);
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

    draw(graphics) {
        graphics.drawQuadrille(this.#UIQuadrille, { x: BOARD_LOCAL_POSITION.x, y: BOARD_LOCAL_POSITION.y, cellLength: BOARD_SQUARE_SIZE });
    }
}