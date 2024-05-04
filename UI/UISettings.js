//UI SETTINGS ----------------------------------------------------------------
//--Board--
const BOARD_SQUARE_SIZE = 40;
const BOARD_WIDTH = BOARD_SQUARE_SIZE * NUMBER_OF_FILES;
const BOARD_HEIGHT = BOARD_SQUARE_SIZE * NUMBER_OF_RANKS;
const BOARD_LOCAL_POSITION = {
    get x() { return BOARD_SQUARE_SIZE },
    get y() { return GAME_STATE_UI_SETTINGS.HEIGHT + GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD }
};
//--Pieces Captured UI--
const PIECES_CAPTURED_UI_SETTINGS = {
    PIECES_SIZE: 30,
    SPACE_FROM_BOARD: 10,
    get WHITE_PIECES_POSITION() {
        return {
            x: BOARD_LOCAL_POSITION.x,
            y: BOARD_LOCAL_POSITION.y - this.PIECES_SIZE - this.SPACE_FROM_BOARD
        }
    },
    get BLACK_PIECES_POSITION() {
        return {
            x: BOARD_LOCAL_POSITION.x,
            y: BOARD_LOCAL_POSITION.y + BOARD_HEIGHT + this.SPACE_FROM_BOARD
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
            x: BOARD_LOCAL_POSITION.x,
            y: BOARD_LOCAL_POSITION.y - this.TEXT_SIZE - this.TEXT_MARGIN - this.SPACE_FROM_BOARD
        }
    }
}
//--Move Record UI--
const MOVE_RECORD_UI_SETTINGS = {
    CELL_LENGTH: 40,
    SPACE_FROM_BOARD: 20,
    MAX_ROWS_VISIBLE: 8,
    get POSITION() {
        return {
            x: BOARD_LOCAL_POSITION.x + BOARD_WIDTH + this.SPACE_FROM_BOARD,
            y: BOARD_LOCAL_POSITION.y
        }
    },
    ROW_HEIGHT: BOARD_SQUARE_SIZE,
    WIDTH: BOARD_SQUARE_SIZE * 3
}
//--Resign Button--
const RESIGN_BUTTON_UI_SETTINGS = {
    POSITION: {
        x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
        y: MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS.ROW_HEIGHT + 20
    },
    WIDTH: 40,
    HEIGHT: 20,
    TEXT: "Resign"
}
//--Rank Files UI--
const RANKS_FILES_UI_SETTING = {
    CELL_LENGTH: BOARD_SQUARE_SIZE,
    TEXT_ZOOM: 0.5,
    TEXT_COLOR: 0,
    RANKS: new Quadrille(1, ['8', '7', '6', '5', '4', '3', '2', '1']),
    FILES: new Quadrille(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
}

const MOVE_INPUT_UI_SETTINGS = {
    COLOR_FOR_SELECTED_SQUARES: 'rgba(100,100,100,0.3)',
    COLOR_FOR_AVAILABLE_MOVES: '#b3ffb3'
}
