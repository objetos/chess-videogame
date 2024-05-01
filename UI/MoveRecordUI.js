//****** cleanup code
class MoveRecordUI {
    #table;

    #currentColumnIndex = 1;
    #firstVisibleRowNumber = 1;
    get #lastRowIndex() {
        return this.#table.height - 1;
    }
    get #lastVisibleRowNumber() {
        return this.#firstVisibleRowNumber + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE - 1;
    }

    #upButton;
    #downButton;


    constructor(moveRecord) {
        moveRecord.addEventListener(MoveRecord.events.onMoveRecorded, this.#onMoveRecorded.bind(this));
        moveRecord.addEventListener(MoveRecord.events.onMoveUnrecorded, this.#onMoveUnrecorded.bind(this));

        this.#table = createQuadrille(3, 1);
        this.#table.fill(0, 0, 1);

        const TABLE_HEIGHT = MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * Quadrille.cellLength;
        const TABLE_WIDTH = 3 * Quadrille.cellLength;

        this.#upButton = createButton("Up");
        this.#upButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20, MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 - 25);
        this.#upButton.mouseClicked(() => {
            this.#firstVisibleRowNumber--
            this.#updateButtons();
        });
        this.#upButton.hide();

        this.#downButton = createButton("Down");
        this.#downButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20, MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 + 25);
        this.#downButton.mouseClicked(() => {
            this.#firstVisibleRowNumber++
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

    #addNewRow() {
        this.#table.insert(this.#table.height);

        let rowNumber = this.#lastRowIndex + 1;

        this.#table.fill(this.#lastRowIndex, 0, rowNumber);

        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < rowNumber) {
            this.#firstVisibleRowNumber = rowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE + 1;
        }
    }

    #addNewEntry(move) {
        let columnNumber = this.#currentColumnIndex + 1;

        if (3 < columnNumber) {
            this.#addNewRow();
            this.#currentColumnIndex = 1;
        }

        this.#table.fill(this.#lastRowIndex, this.#currentColumnIndex, move);
        this.#currentColumnIndex++;
        this.#updateButtons();
    }

    #updateButtons() {
        if (this.#firstVisibleRowNumber < 2 && this.#table.height < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
            this.#upButton.hide();
            this.#downButton.hide();
        } else if (this.#firstVisibleRowNumber < 2 && MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
            this.#upButton.hide();
            this.#downButton.show();
        } else if (2 <= this.#firstVisibleRowNumber && this.#lastVisibleRowNumber < this.#table.height) {
            this.#upButton.show();
            this.#downButton.show();
        } else {
            this.#upButton.show();
            this.#downButton.hide();
        }
    }

    draw() {
        //if there's no entries, do not draw
        if (this.#lastRowIndex === 0 && this.#table.isEmpty(0, 1)) return;

        let tableToDraw = this.#table;
        if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
            tableToDraw = this.#table.row(this.#firstVisibleRowNumber - 1);
            for (let i = 1; i < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE; i++) {
                let rowIndex = this.#firstVisibleRowNumber - 1 + i;
                tableToDraw = Quadrille.or(tableToDraw, this.#table.row(rowIndex), i);
            }
        }

        drawQuadrille(tableToDraw, {
            x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
            y: MOVE_RECORD_UI_SETTINGS.POSITION.y,
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