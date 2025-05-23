/* globals CENTER createButton*/
import { assert } from "../../Testing/TestTools.js";
import { MOVE_RECORD_UI_SETTINGS } from "./UISettings.js";
import MoveRecord from "../MoveRecord.js";
export default class MoveRecordUI {
    #table;

    #currentColumnIndex = 1;
    #firstVisibleRow = 1;
    get #lastRowIndex() {
        return this.#table.height - 1;
    }
    get #lastVisibleRow() {
        return this.#firstVisibleRow + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE - 1;
    }
    get #lastRowNumber() {
        return this.#table.height;
    }

    #upButton;
    #downButton;

    constructor(moveRecord) {
        assert(moveRecord instanceof MoveRecord, "Invalid Move Record");

        moveRecord.addEventListener(MoveRecord.events.onMoveRecorded, this.#onMoveRecorded.bind(this));
        moveRecord.addEventListener(MoveRecord.events.onMoveUnrecorded, this.#onMoveUnrecorded.bind(this));
        moveRecord.addEventListener(MoveRecord.events.onClear, this.#onClear.bind(this));

        this.#table = createQuadrille(3, 1);
        this.#table.fill(0, 0, 1);


        this.#upButton = createButton("Up");
        this.#upButton.mouseClicked(() => {
            this.#firstVisibleRow--
            this.#updateButtons();
        });
        this.#upButton.size(MOVE_RECORD_UI_SETTINGS.BUTTON_WIDTH, MOVE_RECORD_UI_SETTINGS.BUTTON_HEIGHT);
        this.#upButton.hide();

        this.#downButton = createButton("Down");
        this.#downButton.mouseClicked(() => {
            this.#firstVisibleRow++
            this.#updateButtons();
        });
        this.#downButton.size(MOVE_RECORD_UI_SETTINGS.BUTTON_WIDTH, MOVE_RECORD_UI_SETTINGS.BUTTON_HEIGHT);
        this.#downButton.hide();
    }

    #onMoveRecorded(event) {
        let move = event.detail.move;
        this.#addNewEntry(move);
    }

    #onMoveUnrecorded(event) {

    }

    #onClear(event) {
        this.#table.clear();
        this.#table.fill(0, 0, 1);
        this.#table.height = 1;
        this.#currentColumnIndex = 1;
        this.#firstVisibleRow = 1;
        this.#updateButtons();
    }

    #addNewEntry(move) {
        //if row is filled
        if (this.#isRowFill()) {
            //add new row
            this.#addNewRow();
            //fill first column
            this.#table.fill(this.#lastRowIndex, 0, this.#lastRowNumber);
            this.#currentColumnIndex = 1;
        }

        //fill move
        this.#table.fill(this.#lastRowIndex, this.#currentColumnIndex, move);
        this.#currentColumnIndex++;
        this.#updateButtons();
    }


    #isRowFill() {
        let columnNumber = this.#currentColumnIndex + 1;
        return 3 < columnNumber;
    }

    #addNewRow() {
        this.#table.insert(this.#table.height);
        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#lastRowNumber) {
            this.#firstVisibleRow = this.#lastRowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE + 1;
        }
    }

    #updateButtons() {
        //if table has not overflown
        if (this.#firstVisibleRow < 2 && this.#table.height <= MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
            this.#upButton.hide();
            this.#downButton.hide();
        } //else if user is at the top of the table
        else if (this.#firstVisibleRow < 2 && MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
            this.#upButton.hide();
            this.#downButton.show();
        } //else if user is at the middle of the table
        else if (2 <= this.#firstVisibleRow && this.#lastVisibleRow < this.#table.height) {
            this.#upButton.show();
            this.#downButton.show();
        } //else  user is at the bottom of the table
        else {
            this.#upButton.show();
            this.#downButton.hide();
        }
    }

    draw(graphics, graphicsX, graphicsY) {
        //if there's no entries, do not draw
        if (this.#lastRowIndex === 0 && this.#table.isEmpty(0, 1)) return;

        //if table is overflowing, extract visible rows
        let tableToDraw = this.#table;
        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
            let firstVisibleRowIndex = this.#firstVisibleRow - 1;
            tableToDraw = this.#table.row(firstVisibleRowIndex);
            for (let i = 1; i < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE; i++) {
                let rowIndex = firstVisibleRowIndex + i;
                tableToDraw = Quadrille.or(tableToDraw, this.#table.row(rowIndex), i);
            }
        }

        graphics.drawQuadrille(tableToDraw, {
            x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
            y: MOVE_RECORD_UI_SETTINGS.POSITION.y,
            cellLength: MOVE_RECORD_UI_SETTINGS.CELL_LENGTH,
            textZoom: 1,
            numberDisplay: ({ graphics, value, cellLength = this.#table.cellLength } = {}) => {
                graphics.fill(color(0));
                graphics.textAlign(CENTER, CENTER);
                graphics.textSize(cellLength * Quadrille.textZoom * 0.8);
                graphics.text(value, cellLength / 2, cellLength / 2);
            },
        });

        this.#upButton.position(
            graphicsX + MOVE_RECORD_UI_SETTINGS.POSITION.x + MOVE_RECORD_UI_SETTINGS.TABLE_WIDTH + MOVE_RECORD_UI_SETTINGS.BUTTON_SPACE_FROM_TABLE,
            graphicsY + MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.TABLE_HEIGHT / 2 - 25
        );
        this.#downButton.position(
            graphicsX + MOVE_RECORD_UI_SETTINGS.POSITION.x + MOVE_RECORD_UI_SETTINGS.TABLE_WIDTH + MOVE_RECORD_UI_SETTINGS.BUTTON_SPACE_FROM_TABLE,
            graphicsY + MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.TABLE_HEIGHT / 2 + 25
        );
    }
}