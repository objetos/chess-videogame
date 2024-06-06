import { assert } from "../../Testing/TestTools.js";
import { NUMBER_OF_RANKS, NUMBER_OF_FILES } from "../Utils/ChessUtils.js";
import { MOVE_INPUT_UI_SETTINGS, BOARD_UI_SETTINGS } from "./UISettings.js";
import { Game } from "../Game.js";
import MoveInput from "../MoveInput.js";
export default class MoveInputUI {
    #game;
    #UIQuadrille;
    #colorForSelectedSquare;
    #colorForAvailableMoves;
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

        this.#colorForSelectedSquare = color(MOVE_INPUT_UI_SETTINGS.COLOR_FOR_SELECTED_SQUARES);
        this.#colorForAvailableMoves = color(MOVE_INPUT_UI_SETTINGS.COLOR_FOR_AVAILABLE_MOVES);
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
        graphics.drawQuadrille(this.#UIQuadrille,
            {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y,
                cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE,
                outlineWeight: 0
            });
    }
}