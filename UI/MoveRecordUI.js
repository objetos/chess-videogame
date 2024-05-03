//****** cleanup code, assert
class MoveRecordUI {
    #table;

    #currentColumnIndex = 1;
    #firstVisibleRow = 1;
    get #lastRowIndex() {
        return this.#table.height - 1;
    }
    get #lastVisibleRow() {
        return this.#firstVisibleRow + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE - 1;
    }

    #upButton;
    #downButton;

    constructor(moveRecord) {
        assert(moveRecord instanceof MoveRecord, "Invalid Move Record");

        moveRecord.addEventListener(MoveRecord.events.onMoveRecorded, this.#onMoveRecorded.bind(this));
        moveRecord.addEventListener(MoveRecord.events.onMoveUnrecorded, this.#onMoveUnrecorded.bind(this));

        this.#table = createQuadrille(3, 1);
        this.#table.fill(0, 0, 1);

        const TABLE_HEIGHT = MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * Quadrille.cellLength;
        const TABLE_WIDTH = 3 * Quadrille.cellLength;

        this.#upButton = createButton("Up");
        this.#upButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20,
            MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 - 25);
        this.#upButton.mouseClicked(() => {
            this.#firstVisibleRow--
            this.#updateButtons();
        });
        this.#upButton.hide();

        this.#downButton = createButton("Down");
        this.#downButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20,
            MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 + 25);
        this.#downButton.mouseClicked(() => {
            this.#firstVisibleRow++
            this.#updateButtons();
        });

        this.#downButton.hide();
    }

    #onMoveRecorded(event) {
        let move = event.detail.move;
        this.#addNewEntry(move);
    }

    #onMoveUnrecorded(event) {

    }

    #addNewEntry(move) {
        //if row is filled
        if (this.#isRowFill()) {
            //add new row
            this.#addNewRow();
            //fill first column
            let newRowNumber = this.#lastRowIndex + 1;
            this.#table.fill(this.#lastRowIndex, 0, newRowNumber);
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
        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < rowNumber) {
            this.#firstVisibleRow = rowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE + 1;
        }
    }

    #updateButtons() {
        //if table has not overflown
        if (this.#firstVisibleRow < 2 && this.#table.height < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
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

    draw(graphics) {
        //if there's no entries, do not draw
        if (this.#lastRowIndex === 0 && this.#table.isEmpty(0, 1)) return;

        //if table is overflowing, extract visible rows
        let tableToDraw = this.#table;
        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
            tableToDraw = this.#table.row(this.#firstVisibleRow - 1);
            for (let i = 1; i < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE; i++) {
                let rowIndex = this.#firstVisibleRow - 1 + i;
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
    }
}