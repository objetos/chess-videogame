/* globals mouseX, mouseY */
import { E_PieceType } from "./Enums/E_PieceType.js";
import { assert, assertPieceType } from "../Testing/TestTools.js";
import { NUMBER_OF_FILES, NUMBER_OF_RANKS } from "./Utils/ChessUtils.js";
import { BOARD_UI_SETTINGS } from "./UI/UISettings.js";
import Board from "./Board/Board.js";
import Move from "./MoveGeneration/Move.js";
export default class MoveInput extends EventTarget {
    #inputListener;
    #board;

    #inputMoveStart = null;
    #inputMoveDestination = null;

    static inputEvents = {
        onMoveInput: "user:move-input",
        onSquareSelected: "user:square-selected",
        onMoveCanceled: "system:move-canceled",
        onMoveStartSet: "user:move-start-set",
        onMoveDestinationSet: "user:move-destination-set"
    }

    #enabled = true;
    get enabled() {
        return this.#enabled;
    }
    set enabled(enabled) {
        assert(typeof enabled === 'boolean', "enabled is not boolean");
        this.#enabled = enabled;
    }

    /**
     * @param {Board} board Board that Input should listen to
     * @param {number} globalBoardPositionX x position of board in canvas in pixels
     * @param {number} globalBoardPositionY y position of board in canvas in pixels
     */
    constructor(board, globalBoardPositionX, globalBoardPositionY) {
        assert(board instanceof Board, "Invalid board");
        assert(typeof globalBoardPositionX === 'number', "Invalid board x position");
        assert(typeof globalBoardPositionY === 'number', "Invalid board y position");

        super();

        this.#inputListener = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        this.#board = board;

        //listen to click events on main canvas
        select('canvas').mouseClicked(() => {
            this.#handleClick(mouseX, mouseY, globalBoardPositionX, globalBoardPositionY);
        });
    }

    addInputEventListener(event, callback) {
        assert(Object.values(MoveInput.inputEvents).includes(event), "Invalid event");
        this.addEventListener(event, callback);
    }

    reset() {
        this.#CancelMove();
    }

    #handleClick(clickX, clickY, boardPositionX, boardPositionY) {
        if (!this.#enabled) return;
        //get click coordinates relative to page
        let xCoordinate = clickX;
        let yCoordinate = clickY;
        //get clicked square

        let clickedRank = 8 - this.#inputListener.screenRow(yCoordinate, boardPositionY, BOARD_UI_SETTINGS.SQUARE_SIZE);
        let clickedFile = this.#inputListener.screenCol(xCoordinate, boardPositionX, BOARD_UI_SETTINGS.SQUARE_SIZE) + 1;
        let clickedSquare = {
            rank: clickedRank,
            file: clickedFile
        };

        //if click is not within board limits
        let isClickWithinBoardLimits = 1 <= clickedRank && clickedRank <= NUMBER_OF_RANKS && 1 <= clickedFile && clickedFile <= NUMBER_OF_FILES;
        if (!isClickWithinBoardLimits) {
            //if move was started
            if (this.#inputMoveStart !== null) {
                //cancel it
                this.#CancelMove();
            }
            return;
        }

        //notify that a square was selected
        let squareSelectedEvent = new CustomEvent(MoveInput.inputEvents.onSquareSelected, { detail: { square: clickedSquare } })
        this.dispatchEvent(squareSelectedEvent);

        //if move start is not set and there's a piece in selected square
        let pieceInClickedSquare = this.#board.getPieceOnRankFile(clickedRank, clickedFile) !== null;
        if (this.#inputMoveStart === null && pieceInClickedSquare) {

            //set this square as the move start
            this.#inputMoveStart = {
                rank: clickedRank,
                file: clickedFile
            }

            //notify
            let moveStartSetEvent = new CustomEvent(MoveInput.inputEvents.onMoveStartSet, { detail: { square: clickedSquare } })
            this.dispatchEvent(moveStartSetEvent);
        }
        //else if move start is set and destination is not
        else if (this.#inputMoveStart !== null && this.#inputMoveDestination === null) {
            //if start square and destination square are the same
            if ((this.#inputMoveStart.rank === clickedRank && this.#inputMoveStart.file === clickedFile)) {
                //cancel move
                this.#CancelMove();
                return;
            }

            //set this square as the move destination
            this.#inputMoveDestination = {
                rank: clickedRank,
                file: clickedFile
            }
            //notify
            let moveDestinationSet = new CustomEvent(MoveInput.inputEvents.onMoveDestinationSet, { detail: { square: clickedSquare } })
            this.dispatchEvent(moveDestinationSet);

            //create move
            let inputMove = new Move(this.#inputMoveStart.rank, this.#inputMoveStart.file, this.#inputMoveDestination.rank, this.#inputMoveDestination.file);
            //notify
            let moveInput = new CustomEvent(MoveInput.inputEvents.onMoveInput, { detail: { move: inputMove } });
            this.dispatchEvent(moveInput);
            //unset start and destination
            this.#inputMoveStart = null;
            this.#inputMoveDestination = null;
        }
    }

    #CancelMove() {
        this.#inputMoveStart = null;
        this.#inputMoveDestination = null;
        let moveCanceled = new CustomEvent(MoveInput.inputEvents.onMoveCanceled);
        this.dispatchEvent(moveCanceled);
    }

    static #pieceSelectedForPromotion = E_PieceType.Queen;

    static get pieceSelectedForPromotion() {
        return this.#pieceSelectedForPromotion;
    }

    static set pieceSelectedForPromotion(value) {
        assertPieceType(value);
        assert(value !== E_PieceType.Pawn, "Promotion to Pawn is forbidden");
        assert(value !== E_PieceType.King, "Promotion to King is forbidden");
        this.#pieceSelectedForPromotion = value;
    }
}



