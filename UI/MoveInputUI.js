//****** test
class MoveInputUI {
    #game;
    #UIQuadrille;
    #colorForSelectedSquare = color(100, 100);//****** transfer to UISettings
    #colorForAvailableMoves = color(179, 255, 179);
    #moveCompleted = false;

    /**
     * 
     * @param {Game} game 
     * @param {MoveInput} moveInput 
     */
    constructor(game, moveInput) {
        assert(game instanceof Game, "Invalid Game");
        assert(moveInput instanceof MoveInput, "Invalid Move Input");

        this.#game = game;
        this.#UIQuadrille = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        moveInput.addInputEventListener(MoveInput.inputEvents.onMoveStartSet, this.#onMoveStartSet.bind(this));
        moveInput.addInputEventListener(MoveInput.inputEvents.onMoveDestinationSet, this.#onMoveDestinationSet.bind(this));
        moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));
        moveInput.addInputEventListener(MoveInput.inputEvents.onMoveCanceled, this.#onMoveCanceled.bind(this));
    }

    #onMoveStartSet(event) {
        //if a move was just completed
        if (this.#moveCompleted) {
            //clar UI
            this.#Clear();
            this.#moveCompleted = false;
        }
        let square = event.detail.square;
        //fill selected square
        this.#fillSquare(square.rank, square.file, this.#colorForSelectedSquare);
        //draw available moves
        for (let move of this.#game.legalMoves) {
            if (move.startRank === square.rank && move.startFile === square.file) {
                this.#fillSquare(move.endRank, move.endFile, this.#colorForAvailableMoves);
            }
        }
    }

    #onMoveDestinationSet(event) {
        //fill selected square
        this.#fillSquare(event.detail.square.rank, event.detail.square.file, this.#colorForSelectedSquare);
    }

    #fillSquare(rank, file, color) {
        let row = 8 - rank;
        let column = file - 1;
        this.#UIQuadrille.fill(row, column, color);
    }

    #onMoveInput(event) {
        let result = this.#game.isMoveLegal(event.detail.move);
        //if input move is not legal
        if (!result.isLegal) {
            //clear UI
            this.#Clear();
        } else {
            //hide available moves
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