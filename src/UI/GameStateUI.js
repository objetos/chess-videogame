/*globals BOLD, NORMAL, LEFT, BOTTOM, CENTER, TOP */
import { E_GameState } from "../Enums/E_GameState.js";
import { E_PieceColor } from "../Enums/E_PieceColor.js";
import { GAME_STATE_UI_SETTINGS, BOARD_UI_SETTINGS } from "./UISettings.js";
import { OppositePieceColor } from "../Utils/ChessUtils.js";
//assert, document
export default class GameStateUI {
    #game;

    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        this.#game = game;
    }

    draw(graphics) {
        let rectFillTargetColour;
        let textColor;
        let message;

        let gameState = this.#game.state;
        let playingColor = this.#game.playingColor;

        switch (gameState) {
            case E_GameState.PLAYING:
                rectFillTargetColour = playingColor === E_PieceColor.White ? color(255) : color(0);
                textColor = playingColor === E_PieceColor.White ? color(0) : color(255);
                message = playingColor === E_PieceColor.White ? "White Moves" : "Black Moves";
                break;
            case E_GameState.CHECKMATE:
                rectFillTargetColour = this.#game.winningColor === E_PieceColor.White ? color(255) : color(0);
                textColor = this.#game.winningColor === E_PieceColor.White ? color(0) : color(255);
                message = "Checkmate! " + (this.#game.winningColor === E_PieceColor.White ? "White Wins" : "Black Wins");
                break;
            case E_GameState.RESIGNED:
                rectFillTargetColour = this.#game.winningColor === E_PieceColor.White ? color(255) : color(0);
                textColor = this.#game.winningColor === E_PieceColor.White ? color(0) : color(255);
                message = (this.#game.winningColor === E_PieceColor.White ? "White Wins" : "Black Wins");
                break;
            case E_GameState.STALEMATE:
                rectFillTargetColour = color(175);
                textColor = color(0);
                message = "Stalemate!";
                break;
            case E_GameState.DRAW:
                rectFillTargetColour = color(175);
                textColor = color(0);
                message = "Draw!";
                break;
        }

        let rectCenter = GAME_STATE_UI_SETTINGS.POSITION.x + BOARD_UI_SETTINGS.WIDTH / 2;
        graphics.noStroke();
        graphics.fill(rectFillTargetColour);
        graphics.rect(GAME_STATE_UI_SETTINGS.POSITION.x,
            GAME_STATE_UI_SETTINGS.POSITION.y,
            GAME_STATE_UI_SETTINGS.WIDTH,
            GAME_STATE_UI_SETTINGS.HEIGHT);

        graphics.textSize(GAME_STATE_UI_SETTINGS.TEXT_SIZE);
        graphics.fill(textColor)
        graphics.textStyle(BOLD);
        graphics.textAlign(CENTER, TOP);

        graphics.text(message,
            rectCenter,
            GAME_STATE_UI_SETTINGS.POSITION.y + GAME_STATE_UI_SETTINGS.TEXT_MARGIN);

        graphics.textStyle(NORMAL);
        graphics.textAlign(LEFT, BOTTOM);

    }
}