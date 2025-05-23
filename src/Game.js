/*globals  createGraphics,deltaTime,random,image,createButton */
import { E_PieceColor } from "./Enums/E_PieceColor.js";
import { E_GameState } from "./Enums/E_GameState.js";
import { E_GameMode } from "./Enums/E_GameMode.js";
import { E_MoveFlag } from "../src/Enums/E_MoveFlag.js";
import { MOVE_RECORD_UI_SETTINGS, RANKS_FILES_UI_SETTING, BOARD_UI_SETTINGS, GAME_STATE_UI_SETTINGS, PIECES_CAPTURED_UI_SETTINGS, RESIGN_BUTTON_UI_SETTINGS, RESET_BUTTON_UI_SETTINGS } from "./UI/UISettings.js";
import { OppositePieceColor, PIECE_TYPES_TO_PROMOTE } from "./Utils/ChessUtils.js";
import { assert } from "../Testing/TestTools.js";
import Board from "./Board/Board.js";
import MoveRecord from "./MoveRecord.js";
import MoveInput from "./MoveInput.js";
import MoveInputUI from "./UI/MoveInputUI.js";
import MoveRecordUI from "./UI/MoveRecordUI.js";
import PiecesCapturedUI from "./UI/PiecesCapturedUI.js";
import GameStateUI from "./UI/GameStateUI.js";
import PromotionSelector from "./UI/PromotionSelector.js";
import { E_CastlingSide } from "./Enums/E_CastlingSide.js";
import BoardImplementation from "./Board/BoardImplementation.js";


//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

//--GAME DIMENSIONS--
export const GAME_DIMENSIONS = {
    WIDTH: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        BOARD_UI_SETTINGS.WIDTH +
        MOVE_RECORD_UI_SETTINGS.SPACE_FROM_BOARD +
        MOVE_RECORD_UI_SETTINGS.WIDTH,
    HEIGHT: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        GAME_STATE_UI_SETTINGS.HEIGHT +
        GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD +
        BOARD_UI_SETTINGS.WIDTH +
        PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD +
        PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE
}

//****** assert, document
export class Game {
    //Game State
    #playingColor = E_PieceColor.White;
    #gameState = E_GameState.PLAYING;
    #gameMode = E_GameMode.STANDARD;
    #timerToMove = 0;
    #automaticMovesTimeInterval = 1000;
    #winningColor = null;
    #startColor = undefined;

    get playingColor() {
        return this.#playingColor;
    }
    get state() {
        return this.#gameState;
    }
    get winningColor() {
        return this.#winningColor;
    }
    /**
     * Time between moves in Automatic mode in miliseconds. 1000ms by default
     */
    set automaticMovesTimeInterval(value) {
        assert(typeof value === 'number', "Invalid value");
        this.#automaticMovesTimeInterval = value;
    }

    //Objects
    #legalMoves = [];
    get legalMoves() {
        return this.#legalMoves;
    }
    #moveRecord;
    #moveInput;
    #board;
    get board() {
        return this.#board;
    }

    //UI
    #moveRecordUI;
    #moveInputUI;
    #piecesCapturedUI;
    #gameStateUI;
    #resignButton;
    #resetButton;
    #graphics;
    #promotionSelector;
    #position;

    /**
     * Creates a new chess game
     * @param {number} xPosition x position of game in canvas
     * @param {number} yPosition y position of game in canvas
     * @param {string} inputFen FEN of board
     * @param {E_PieceColor} playingColor Color that starts playing
     */
    constructor(xPosition, yPosition, inputFen = STANDARD_BOARD_FEN, playingColor = E_PieceColor.White) {
        this.#graphics = createGraphics(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.#position = { x: xPosition, y: yPosition }

        this.#board = new Board(inputFen);
        this.#playingColor = playingColor;
        this.#legalMoves = this.#board.generateMoves(playingColor);

        this.#moveInput = new MoveInput(this.#board, xPosition + BOARD_UI_SETTINGS.LOCAL_POSITION.x, yPosition + BOARD_UI_SETTINGS.LOCAL_POSITION.y);
        this.#moveInput.enabled = true;
        this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
        this.#moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));

        this.#moveRecord = new MoveRecord();
        this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
        this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
        this.#gameStateUI = new GameStateUI(this);
        this.#promotionSelector = new PromotionSelector();
        this.#createResignButton();
        this.#createResetButton();

        this.#startColor = playingColor;

        this.#checkEndGame(playingColor);
        this.#checkEndGame(OppositePieceColor(playingColor));

        this.update();
    }

    isGameFinished() {
        return this.#gameState !== E_GameState.PLAYING;
    }

    isMoveLegal(inputMove) {

        let isSameMove = (move) => {
            return inputMove.startRank === move.startRank &&
                inputMove.startFile === move.startFile &&
                inputMove.endRank === move.endRank &&
                inputMove.endFile === move.endFile;
        };

        //input move is legal if it is found in set of legal moves 
        let legalMove = this.#legalMoves.find(isSameMove);
        let isLegal = legalMove !== undefined;

        return {
            isLegal: isLegal,
            move: legalMove
        }
    }

    /**
     * Updates game state and view.
     */
    update() {
        if (this.#gameMode === E_GameMode.AUTOMATIC) {
            this.#runGameAutomatically();
        }
        this.#draw();
    }

    /**
     * Sets mode in which the game is playing.
     * STANDARD: Standard chess with all moves. Player makes moves on board.
     * AUTOMATIC: The machine will make random moves automatically until the game is finished. No draw offers.
     * FREE: Any color can move. Board might have a legal configuration or not. No end game. No option for resigning nor draw offers. Player makes moves on board.
     * VIEW-ONLY: No input received. 
     * @param {E_GameMode} gameMode 
     */
    setGameMode(gameMode) {
        assert(Object.values(E_GameMode).includes(gameMode), "Invalid game mode");
        this.#gameMode = gameMode;
        this.#generateLegalMoves();
        this.#checkEndGame(this.#playingColor);
        this.#checkEndGame(OppositePieceColor(this.#playingColor));
        this.update();
        this.#updateInput();
    }

    reset() {
        this.#gameState = E_GameState.PLAYING;
        this.#playingColor = this.#startColor;
        this.#board.reset();
        this.#moveRecord.clear();
        this.#moveInput.reset();
        this.#winningColor = null;
        this.#generateLegalMoves();
        this.#checkEndGame(this.#playingColor);
        this.#checkEndGame(OppositePieceColor(this.#playingColor));
        this.update();
    }

    #updateInput() {
        switch (this.#gameMode) {
            case E_GameMode.STANDARD:
                this.#moveInput.enabled = !this.isGameFinished();
                break;
            case E_GameMode.AUTOMATIC:
                this.#moveInput.enabled = false;
                break;
            case E_GameMode.FREE:
                this.#moveInput.enabled = true;
                break;
            case E_GameMode.VIEW_ONLY:
                this.#moveInput.enabled = false;
                break;
        }
    }

    #runGameAutomatically() {
        if (this.isGameFinished()) return;
        this.#timerToMove += deltaTime;
        if (this.#automaticMovesTimeInterval < this.#timerToMove) {
            let randomMove = random(this.#legalMoves);
            if (randomMove.flag === E_MoveFlag.Promotion) {
                randomMove.newPieceType = random(PIECE_TYPES_TO_PROMOTE);
            }
            this.#makeMoveAndAdvance(randomMove);
            this.#timerToMove = 0;
        }
    }

    #draw() {
        this.#graphics.background(255);

        this.#moveRecordUI.draw(this.#graphics, this.#position.x, this.#position.y);
        this.#piecesCapturedUI.draw(this.#graphics);

        if (this.#gameMode !== E_GameMode.FREE) {
            this.#gameStateUI.draw(this.#graphics);
        }

        this.#board.draw(this.#graphics);
        this.#moveInputUI.draw(this.#graphics);
        this.#promotionSelector.draw(this.#graphics);

        this.#drawRanksAndFiles(this.#graphics);

        this.#updateResignButton();
        this.#updateResetButton();

        image(this.#graphics, this.#position.x, this.#position.y);
    }


    #onMoveInput(event) {
        //get input move
        let inputMove = event.detail.move;

        //if input move is legal
        let result = this.isMoveLegal(inputMove);
        if (result.isLegal) {
            let legalMove = result.move;
            if (legalMove.flag === E_MoveFlag.Promotion) {

                this.#moveInput.enabled = false;
                let onPieceSeleted = () => {
                    this.#makeMoveAndAdvance(legalMove);
                    this.#moveInput.enabled = true;
                }
                this.#promotionSelector.selectNewPiece(legalMove, onPieceSeleted.bind(this));

            } else {
                this.#makeMoveAndAdvance(legalMove);
            }
        }
    }

    #makeMoveAndAdvance(move) {
        this.#moveRecord.recordMove(move, this.#board, this.#playingColor);
        //make move on board
        this.#board.makeMove(move);
        //switch playing color
        if (this.#gameMode !== E_GameMode.FREE) this.#switchPlayingColor();
        //generate new set of legal moves
        this.#generateLegalMoves();
        //check for end game conditions
        if (this.#gameMode !== E_GameMode.FREE) this.#checkEndGame(this.#playingColor);
    }

    #switchPlayingColor() {
        this.#playingColor = OppositePieceColor(this.#playingColor);
    }

    #generateLegalMoves() {
        this.#legalMoves = this.#board.generateMoves(this.#playingColor);
        if (this.#gameMode === E_GameMode.FREE) {
            this.#legalMoves = this.#legalMoves.concat(this.#board.generateMoves(OppositePieceColor(this.playingColor)));
        }
    }

    #checkEndGame(playingColor) {
        //if there are no moves left
        let legalMoves = this.#board.generateMoves(playingColor);
        if (legalMoves.length === 0) {
            //and king is in check
            if (this.#board.isKingInCheck(playingColor)) {
                //game finished by checkmate
                this.#gameState = E_GameState.CHECKMATE;
                this.#winningColor = OppositePieceColor(playingColor);
            }
            else {
                //game finished by stalemate
                this.#gameState = E_GameState.STALEMATE;
            }
        } else {
            //this.#checkDraw();
        }
    }

    // #checkDraw() {
    //     if (false) {
    //         this.#gameState = E_GameState.DRAW;
    //     }
    // }

    #createResignButton() {
        let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
        button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
        button.mouseClicked(this.#onResign.bind(this));
        this.#resignButton = button;
    }

    #createResetButton() {
        let button = createButton(RESET_BUTTON_UI_SETTINGS.TEXT);
        button.position(this.#position.x + RESET_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESET_BUTTON_UI_SETTINGS.POSITION.y);
        button.mouseClicked(() => {
            this.reset();
        });
        this.#resetButton = button;
    }

    #updateResetButton() {
        if (this.#gameMode === E_GameMode.VIEW_ONLY) {
            this.#resetButton.hide();
        } else {
            this.#resetButton.show();
        }
    }

    #updateResignButton() {
        if (this.isGameFinished() || this.#gameMode === E_GameMode.FREE || this.#gameMode === E_GameMode.VIEW_ONLY) {
            this.#resignButton.hide();
        } else {
            this.#resignButton.show();
        }
    }

    #onResign() {
        this.#gameState = E_GameState.RESIGNED;
        this.#winningColor = OppositePieceColor(this.#playingColor);
    }

    #drawRanksAndFiles(graphics) {
        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.RANKS,
            {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x - RANKS_FILES_UI_SETTING.CELL_LENGTH,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0

            });

        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.FILES,
            {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0
            });
    }

}

//EXPORTS
export { E_GameMode };
export { default as Board } from "../src/Board/Board.js";
export { E_PieceColor } from "../src/Enums/E_PieceColor.js";
export { E_PieceType } from "../src/Enums/E_PieceType.js";
export { E_CastlingSide } from "../src/Enums/E_CastlingSide.js"
export { E_MoveFlag } from "../src/Enums/E_MoveFlag.js";
export { default as BoardImplementation } from "../src/Board/BoardImplementation.js";
export { default as Rook } from "../src/MoveGeneration/Pieces/Rook.js";
export { default as Bishop } from "../src/MoveGeneration/Pieces/Bishop.js";
export { default as Knight } from "../src/MoveGeneration/Pieces/Knight.js";
export { default as Pawn } from "../src/MoveGeneration/Pieces/Pawn.js";
export { default as Queen } from "../src/MoveGeneration/Pieces/Queen.js";
export { default as King } from "../src/MoveGeneration/Pieces/King.js";
export * as ChessUtils from "../src/Utils/ChessUtils.js";
export * as BitboardUtils from "../src/Utils/BitboardUtils.js";
export * as UISettings from "../src/UI/UISettings.js"

