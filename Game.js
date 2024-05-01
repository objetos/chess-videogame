//--GAME DIMENSIONS--
const GAME_DIMENSIONS = {
    WIDTH: BOARD_WIDTH +
        MOVE_RECORD_UI_SETTINGS.SPACE_FROM_BOARD +
        MOVE_RECORD_UI_SETTINGS.WIDTH,
    HEIGHT: GAME_STATE_UI_SETTINGS.HEIGHT +
        GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD +
        BOARD_WIDTH +
        PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD +
        PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE
}

class Game {

    //Game State
    #gameFinished = false;
    #playingColor = E_PieceColor.White;
    get playingColor() {
        return this.#playingColor;
    }
    #gameState = E_GameState.PLAYING;
    get state() {
        return this.#gameState;
    }

    //Objects
    #legalMoves = [];
    get legalMoves() {
        return this.#legalMoves;
    }
    #moveRecord;
    #moveInput;
    #board;

    //UI
    #moveRecordUI;
    #moveInputUI;
    #piecesCapturedUI;
    #gameStateUI;
    #graphics;
    #position;

    constructor(xPosition, yPosition, inputFen = STANDARD_BOARD_FEN, playingColor = E_PieceColor.White) {
        this.#graphics = createGraphics(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.#position = { x: xPosition, y: yPosition }

        this.#board = new Board(inputFen);
        this.#playingColor = playingColor;
        this.#legalMoves = this.#board.generateMoves(playingColor);

        this.#moveInput = new MoveInput(this.#board, xPosition + BOARD_LOCAL_POSITION.x, yPosition + BOARD_LOCAL_POSITION.y);
        this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
        this.#moveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, this.#onMoveInput.bind(this));

        this.#moveRecord = new MoveRecord();
        this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
        this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
        this.#gameStateUI = new GameStateUI(this);
        //createResignButton(); ******
    }

    isGameFinished() {
        return this.#gameState !== E_GameState.PLAYING;
    }

    isMoveLegal(inputMove) {
        let isSameMove = (move) => {
            return inputMove.startRank === move.startRank &&
                inputMove.startFile === move.startFile &&
                inputMove.endRank === move.endRank &&
                inputMove.endFile === move.endFile;
        };
        let legalMove = this.#legalMoves.find(isSameMove);
        let isLegal = legalMove !== undefined;
        return {
            isLegal: isLegal,
            move: legalMove
        }
    }

    draw() {
        this.#graphics.background(255);

        this.#moveRecordUI.draw(this.#graphics);
        this.#piecesCapturedUI.draw(this.#graphics);
        this.#gameStateUI.draw(this.#graphics);

        this.#moveInputUI.draw(this.#graphics);
        this.#board.draw(this.#graphics);

        image(this.#graphics, this.#position.x, this.#position.y);
    }


    #onMoveInput(event) {
        if (this.isGameFinished()) return;
        //get input move
        let inputMove = event.detail.move;

        //if input move is legal
        let result = this.isMoveLegal(inputMove);
        if (result.isLegal) {
            let legalMove = result.move;
            //record move
            this.#moveRecord.recordMove(legalMove, this.#board, this.#playingColor);
            //make move on board
            this.#board.makeMove(legalMove);
            //switch playing color
            this.#SwitchPlayingColor();
            //generate new set of legal moves
            this.#legalMoves = this.#board.generateMoves(this.#playingColor);
            //check for end game conditions
            this.#CheckEndGame();
        }
    }

    #SwitchPlayingColor() {
        this.#playingColor = OppositePieceColor(this.#playingColor);
    }

    #CheckEndGame() {
        if (this.#legalMoves.length === 0) {
            if (this.#board.isKingInCheck(this.#playingColor)) {
                this.#gameState = E_GameState.CHECKMATE;
            }
            else {
                this.#gameState = E_GameState.STALEMATE;
            }
        } else {
            //this.#CheckDraw();
        }
    }

    #CheckDraw() {
        if (false) {
            this.#gameState = E_GameState.DRAW;
        }
    }
} 