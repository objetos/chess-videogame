import { assert } from "../../Testing/TestTools.js";
import { PIECES_CAPTURED_UI_SETTINGS } from "./UISettings.js";
import Board from "../Board/Board.js";
import { E_PieceColor } from "../Enums/E_PieceColor.js";
export default class PiecesCapturedUI {
    #board;

    constructor(board) {
        assert(board instanceof Board, "Invalid board");
        this.#board = board;
    }

    draw(graphics) {
        graphics.textSize(PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE);
        graphics.fill(color(0));
        graphics.textAlign(LEFT, TOP);

        graphics.text(this.#board.getCapturedPieces(E_PieceColor.White),
            PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.x,
            PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.y);

        graphics.text(this.#board.getCapturedPieces(E_PieceColor.Black),
            PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.x,
            PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.y);

        graphics.textAlign(LEFT, BOTTOM);
    }
}