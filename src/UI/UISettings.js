import { NUMBER_OF_RANKS, NUMBER_OF_FILES } from "../Utils/ChessUtils.js";

//UI SETTINGS ----------------------------------------------------------------
//--Board--
export const BOARD_UI_SETTINGS = {
    SQUARE_SIZE: 40,
    get WIDTH() { return this.SQUARE_SIZE * NUMBER_OF_FILES },
    get HEIGHT() { return this.SQUARE_SIZE * NUMBER_OF_RANKS },
    LOCAL_POSITION: {
        get x() { return BOARD_UI_SETTINGS.SQUARE_SIZE },
        get y() { return GAME_STATE_UI_SETTINGS.HEIGHT + GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD }
    },
    WHITE_SQUARE_COLOR: '#ffffff',
    BLACK_SQUARE_COLOR: '#44c969',
    OUTLINE: '#44c969',
    PIECES_SIZE: 35,
    PIECES_COLOR: '#000000'
}
//--Pieces Captured UI--
export const PIECES_CAPTURED_UI_SETTINGS = {
    PIECES_SIZE: 30,
    SPACE_FROM_BOARD: 0,
    get WHITE_PIECES_POSITION() {
        return {
            x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
            y: BOARD_UI_SETTINGS.LOCAL_POSITION.y - this.PIECES_SIZE - this.SPACE_FROM_BOARD
        }
    },
    get BLACK_PIECES_POSITION() {
        return {
            x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
            y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT + this.SPACE_FROM_BOARD + RANKS_FILES_UI_SETTING.CELL_LENGTH
        }
    }
}
//--Game State UI--
export const GAME_STATE_UI_SETTINGS = {
    TEXT_SIZE: 20,
    TEXT_MARGIN: 10,
    SPACE_FROM_BOARD: 55,
    WIDTH: BOARD_UI_SETTINGS.WIDTH,
    get HEIGHT() {
        return this.TEXT_SIZE + 2 * this.TEXT_MARGIN;
    },
    get POSITION() {
        return {
            x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
            y: BOARD_UI_SETTINGS.LOCAL_POSITION.y - this.TEXT_SIZE - this.TEXT_MARGIN - this.SPACE_FROM_BOARD
        }
    }
}
//--Move Record UI--
export const MOVE_RECORD_UI_SETTINGS = {
    CELL_LENGTH: 40,
    SPACE_FROM_BOARD: 20,
    MAX_ROWS_VISIBLE: 8,
    BUTTON_SPACE_FROM_TABLE: 20,
    BUTTON_WIDTH: 50,
    BUTTON_HEIGHT: 20,
    get POSITION() {
        return {
            x: BOARD_UI_SETTINGS.LOCAL_POSITION.x + BOARD_UI_SETTINGS.WIDTH + this.SPACE_FROM_BOARD,
            y: BOARD_UI_SETTINGS.LOCAL_POSITION.y
        }
    },
    ROW_HEIGHT: BOARD_UI_SETTINGS.SQUARE_SIZE,
    get TABLE_WIDTH() { return BOARD_UI_SETTINGS.SQUARE_SIZE * 3 },
    get TABLE_HEIGHT() { return this.ROW_HEIGHT * this.MAX_ROWS_VISIBLE },
    get WIDTH() { return this.TABLE_WIDTH + this.BUTTON_SPACE_FROM_TABLE + this.BUTTON_WIDTH },
    get HEIGHT() { return this.ROW_HEIGHT * this.MAX_ROWS_VISIBLE }
}
//--Rank Files UI--
export const RANKS_FILES_UI_SETTING = {
    CELL_LENGTH: BOARD_UI_SETTINGS.SQUARE_SIZE,
    TEXT_ZOOM: 0.5,
    TEXT_COLOR: 0,
    RANKS: new Quadrille(1, ['8', '7', '6', '5', '4', '3', '2', '1']),
    FILES: new Quadrille(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
}

//--Resign Button--
export const RESIGN_BUTTON_UI_SETTINGS = {
    POSITION: {
        x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
        y: MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS.ROW_HEIGHT + 20
    },
    WIDTH: 40,
    HEIGHT: 20,
    TEXT: "Resign"
}
//--Reset Button--
export const RESET_BUTTON_UI_SETTINGS = {
    POSITION: {
        x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
        y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT + RANKS_FILES_UI_SETTING.CELL_LENGTH + PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD + PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE + 10
    },
    WIDTH: 40,
    HEIGHT: 20,
    TEXT: "Reset"
}

export const MOVE_INPUT_UI_SETTINGS = {
    COLOR_FOR_SELECTED_SQUARES: 'rgba(100,100,100,0.5)',
    COLOR_FOR_AVAILABLE_MOVES: 'rgba(245, 246, 130,0.7)'
}
//--Promotion Selector--
export const PROMOTION_SELECTOR_SETTINGS = {
    BACKGROUND_COLOR: 'rgba(255,255,255,1)'
}
