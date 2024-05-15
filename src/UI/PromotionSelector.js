import { E_PieceColor, E_PieceType } from "../Game.js";
import Promotion from "../MoveGeneration/Promotion.js";
import { NUMBER_OF_RANKS, pieceColorTypeToKey, pieceKeyToType } from "../Utils/ChessUtils.js";
import { BOARD_LOCAL_POSITION, BOARD_SQUARE_SIZE } from "./UISettings.js";

export default class PromotionSelector {
    #whiteSelectionUI;
    #blackSelectionUI;
    #background;


    #enabledSelector = null;
    #drawingCoordinates = {
        x: 0,
        y: 0
    };
    #onSelection = null;
    #clickListener = (event) => { this.#handleClick(); };

    constructor() {
        let whitePieces = [
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Queen)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Knight)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Rook)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Bishop)]
        ]

        let blackPieces = [
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Bishop)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Rook)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Knight)],
            Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Queen)]
        ]

        this.#whiteSelectionUI = new Quadrille(1, whitePieces);
        this.#blackSelectionUI = new Quadrille(1, blackPieces);
        this.#background = new Quadrille(1, 4);
        this.#background.fill(color(255));
    }

    /**
     * 
     * @param {Promotion} promotion Promotion move involved
     * @param {function} onSelection Callback called when piece is successfully selected
     * @param {E_PieceColor} playingColor Color that makes the promotion
     */
    selectNewPiece(promotion, onSelection, playingColor) {
        console.log("select new piece")
        this.#onSelection = function (pieceTypeSelected) {
            promotion.newPieceType = pieceTypeSelected;
            onSelection();
        }
        //enable selector  on destination square
        let selector = playingColor === E_PieceColor.White ? this.#whiteSelectionUI : this.#blackSelectionUI;
        this.#enableSelector(selector, promotion.endRank, promotion.endFile);
    }

    #enableSelector(selector, rank, file) {
        this.#enabledSelector = selector;

        let targetRow = NUMBER_OF_RANKS - rank + 1;
        let targetColumn = file;

        this.#drawingCoordinates.x = BOARD_LOCAL_POSITION.x + (targetColumn - 1) * BOARD_SQUARE_SIZE;
        this.#drawingCoordinates.y = selector === this.#whiteSelectionUI ?
            BOARD_LOCAL_POSITION.y + (targetRow - 1) * BOARD_SQUARE_SIZE :
            BOARD_LOCAL_POSITION.y + (targetRow - 4) * BOARD_SQUARE_SIZE;

        select('canvas').elt.addEventListener("click", this.#clickListener)
    }

    #disableSelector() {
        this.#enabledSelector = null;
        select('canvas').elt.removeEventListener("click", this.#clickListener);

    }

    draw(graphics) {
        if (this.#enabledSelector === null) return;
        graphics.drawQuadrille(this.#background,
            {
                x: this.#drawingCoordinates.x,
                y: this.#drawingCoordinates.y,
                cellLength: BOARD_SQUARE_SIZE
            });
        graphics.drawQuadrille(this.#enabledSelector,
            {
                x: this.#drawingCoordinates.x,
                y: this.#drawingCoordinates.y,
                cellLength: BOARD_SQUARE_SIZE
            });
    }


    #handleClick() {
        //get piece selected
        let pieceSelected = this.#enabledSelector.read(this.#enabledSelector.mouseRow, 0);
        if (pieceSelected === undefined) return;

        let pieceKey = Quadrille.chessKeys[pieceSelected];
        let pieceType = pieceKeyToType(pieceKey);
        this.#onSelection(pieceType);
        this.#onSelection = undefined;
        this.#disableSelector();
    }
}