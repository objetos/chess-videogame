import { E_PieceColor } from "./Enums/E_PieceColor.js";
import { E_GameState } from "./Enums/E_GameState.js";
import { MOVE_RECORD_UI_SETTINGS, RANKS_FILES_UI_SETTING, BOARD_WIDTH, GAME_STATE_UI_SETTINGS, PIECES_CAPTURED_UI_SETTINGS, RESIGN_BUTTON_UI_SETTINGS, BOARD_LOCAL_POSITION, BOARD_HEIGHT } from "./UI/UISettings.js";
import { OppositePieceColor } from "./Utils/ChessUtils.js";
import Board from "./Board/Board.js";
import MoveRecord from "./MoveRecord.js";
import MoveInput from "./MoveInput.js";
import MoveInputUI from "./UI/MoveInputUI.js";
import MoveRecordUI from "./UI/MoveRecordUI.js";
import PiecesCapturedUI from "./UI/PiecesCapturedUI.js";
import GameStateUI from "./UI/GameStateUI.js";
//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const STANDARD_NO_KINGS_FEN = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR';

//--GAME DIMENSIONS--
export const GAME_DIMENSIONS = {
    WIDTH: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        BOARD_WIDTH +
        MOVE_RECORD_UI_SETTINGS.SPACE_FROM_BOARD +
        MOVE_RECORD_UI_SETTINGS.WIDTH,
    HEIGHT: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        GAME_STATE_UI_SETTINGS.HEIGHT +
        GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD +
        BOARD_WIDTH +
        PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD +
        PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE
}



//****** assert, document
export default class Game {
    //Game State
    #playingColor = E_PieceColor.White;
    #gameState = E_GameState.PLAYING;

    get playingColor() {
        return this.#playingColor;
    }
    get state() {
        return this.#gameState;
    }

    //Objects
    #legalMoves = [];
    get legalMoves() {
        return this.#legalMoves;
    }
    #moveRecord;
    #moveInput;
    #board;

    //UI
    #moveRecordUI;
    #moveInputUI;
    #piecesCapturedUI;
    #gameStateUI;
    #graphics;
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

        this.#moveInput = new MoveInput(this.#board, xPosition + BOARD_LOCAL_POSITION.x, yPosition + BOARD_LOCAL_POSITION.y);
        this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
        this.#moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));

        this.#moveRecord = new MoveRecord();
        this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
        this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
        this.#gameStateUI = new GameStateUI(this);
        this.#createResignButton();
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

    draw() {
        this.#graphics.background(255);

        this.#moveRecordUI.draw(this.#graphics);
        this.#piecesCapturedUI.draw(this.#graphics);
        this.#gameStateUI.draw(this.#graphics);

        this.#moveInputUI.draw(this.#graphics);
        this.#board.draw(this.#graphics);

        this.#drawRanksAndFiles(this.#graphics);

        image(this.#graphics, this.#position.x, this.#position.y);
    }


    #onMoveInput(event) {
        //if game is finished, disable input
        if (this.isGameFinished()) return;
        //get input move
        let inputMove = event.detail.move;

        //if input move is legal
        let result = this.isMoveLegal(inputMove);
        if (result.isLegal) {
            let legalMove = result.move;
            //record move
            this.#moveRecord.recordMove(legalMove, this.#board, this.#playingColor);
            //make move on board
            this.#board.makeMove(legalMove);
            //switch playing color
            this.#switchPlayingColor();
            //generate new set of legal moves
            this.#legalMoves = this.#board.generateMoves(this.#playingColor);
            //check for end game conditions
            this.#checkEndGame();
        }
    }

    #switchPlayingColor() {
        this.#playingColor = OppositePieceColor(this.#playingColor);
    }

    #checkEndGame() {
        //if there are no moves left
        if (this.#legalMoves.length === 0) {
            //and king is in check
            if (this.#board.isKingInCheck(this.#playingColor)) {
                //game finished by checkmate
                this.#gameState = E_GameState.CHECKMATE;
            }
            else {
                //game finished by stalemate
                this.#gameState = E_GameState.STALEMATE;
            }
        } else {
            //this.#checkDraw();
        }
    }

    #checkDraw() {
        if (false) {
            this.#gameState = E_GameState.DRAW;
        }
    }

    #createResignButton() {
        let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
        button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
        button.mouseClicked(() => {
            this.#gameState = E_GameState.RESIGNED;
            button.hide();
        });
    }

    #drawRanksAndFiles(graphics) {
        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.RANKS,
            {
                x: BOARD_LOCAL_POSITION.x - RANKS_FILES_UI_SETTING.CELL_LENGTH,
                y: BOARD_LOCAL_POSITION.y,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0

            });

        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.FILES,
            {
                x: BOARD_LOCAL_POSITION.x,
                y: BOARD_LOCAL_POSITION.y + BOARD_HEIGHT,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0
            });
    }

}