//****** cleanup code
class MoveRecordUI {
    #table;

    constructor(moveRecord) {
        moveRecord.addEventListener(MoveRecord.events.onMoveRecorded, this.#onMoveRecorded.bind(this));
        moveRecord.addEventListener(MoveRecord.events.onMoveUnrecorded, this.#onMoveUnrecorded.bind(this));
        this.#table = createQuadrille(3, 1);
    }

    #onMoveRecorded(event) {
        let move = event.detail.move;
        let currentRowIndex = this.#table.height - 1;
        if (this.#table.read(currentRowIndex, 0) === null) {
            this.#table.fill(currentRowIndex, 0, this.#table.height);
            this.#table.fill(currentRowIndex, 1, move);
        } else if (this.#table.read(currentRowIndex, 2) === null) {
            this.#table.fill(currentRowIndex, 2, move);
        } else {
            this.#table.insert(this.#table.height);
            this.#table.fill(this.#table.height - 1, 0, this.#table.height);
            this.#table.fill(this.#table.height - 1, 1, move);
            if (this.#table.height > MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
                this.#table.delete(0);
            }
        }
    }

    #onMoveUnrecorded(event) {

    }

    draw() {
        if (this.#table.read(0, 0) === null) return;
        drawQuadrille(this.#table, {
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