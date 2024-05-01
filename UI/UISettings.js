//UI SETTINGS ----------------------------------------------------------------
//--Board--
const BOARD_SQUARE_SIZE = 40;
const BOARD_WIDTH = BOARD_SQUARE_SIZE * NUMBER_OF_FILES;
const BOARD_HEIGHT = BOARD_SQUARE_SIZE * NUMBER_OF_RANKS;
const BOARD_POSITION = {
    get x() { return (window.innerWidth - BOARD_WIDTH) / 2 },
    get y() { return (window.innerHeight - BOARD_WIDTH) / 2 }
};
//--Pieces Captured UI--
const PIECES_CAPTURED_UI_SETTINGS = {
    PIECES_SIZE: 30,
    SPACE_FROM_BOARD: 10,
    get WHITE_PIECES_POSITION() {
        return {
            x: BOARD_POSITION.x,
            y: BOARD_POSITION.y - this.PIECES_SIZE - this.SPACE_FROM_BOARD
        }
    },
    get BLACK_PIECES_POSITION() {
        return {
            x: BOARD_POSITION.x,
            y: BOARD_POSITION.y + BOARD_HEIGHT + this.SPACE_FROM_BOARD
        }
    }
}
//--Game State UI--
const GAME_STATE_UI_SETTINGS = {
    TEXT_SIZE: 20,
    TEXT_MARGIN: 10,
    SPACE_FROM_BOARD: 55,
    WIDTH: BOARD_WIDTH,
    get HEIGHT() {
        return this.TEXT_SIZE + 2 * this.TEXT_MARGIN;
    },
    get POSITION() {
        return {
            x: BOARD_POSITION.x,
            y: BOARD_POSITION.y - this.TEXT_SIZE - this.TEXT_MARGIN - this.SPACE_FROM_BOARD
        }
    }
}
//--Move Record UI--
const MOVE_RECORD_UI_SETTINGS = {
    SPACE_FROM_BOARD: 20,
    MAX_ROWS_VISIBLE: 8,
    get POSITION() {
        return {
            x: BOARD_POSITION.x + BOARD_WIDTH + this.SPACE_FROM_BOARD,
            y: BOARD_POSITION.y
        }
    },
    ROW_HEIGHT: BOARD_SQUARE_SIZE
}
//--Resign Button--
const RESIGN_BUTTON_SETTINGS = {
    POSITION: {
        x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
        y: MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS.ROW_HEIGHT + 20
    },
    WIDTH: 40,
    HEIGHT: 20
}