//--GAME DIMENSIONS--
const GAME_DIMENSIONS = {
    WIDTH: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        BOARD_WIDTH +
        MOVE_RECORD_UI_SETTINGS.SPACE_FROM_BOARD +
        MOVE_RECORD_UI_SETTINGS.WIDTH,
    HEIGHT: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        GAME_STATE_UI_SETTINGS.HEIGHT +
        GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD +
        BOARD_WIDTH +
        PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD +
        PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE
}

//assert, document
class Game {
    //Game State
    #playingColor = E_PieceColor.White;
    #gameState = E_GameState.PLAYING;
    #gameMode = E_GameMode.STANDARD;
    get playingColor() {
        return this.#playingColor;
    }
    get state() {
        return this.#gameState;
    }
    #timerToMove = 0;
    #timeToMakeMove = 50;

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
    #resignButton;
    #graphics;
    #position;

    /**
     * Creates a new chess game
     * @param {number} xPosition x position of game in canvas
     * @param {number} yPosition y position of game in canvas
     * @param {string} inputFen FEN of board
     * @param {E_PieceColor} playingColor Color that starts playing
     */
    constructor(xPosition, yPosition, inputFen = STANDARD_BOARD_FEN, playingColor = E_PieceColor.White) {
        this.#graphics = createGraphics(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.#position = { x: xPosition, y: yPosition }

        this.#board = new Board(inputFen);
        this.#playingColor = playingColor;
        this.#legalMoves = this.#board.generateMoves(playingColor);

        this.#moveInput = new MoveInput(this.#board, xPosition + BOARD_LOCAL_POSITION.x, yPosition + BOARD_LOCAL_POSITION.y);
        this.#moveInput.enabled = true;
        this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
        this.#moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));

        this.#moveRecord = new MoveRecord();
        this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
        this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
        this.#gameStateUI = new GameStateUI(this);
        this.#createResignButton();
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

        //input move is legal if it is found in set of legal moves 
        let legalMove = this.#legalMoves.find(isSameMove);
        let isLegal = legalMove !== undefined;

        return {
            isLegal: isLegal,
            move: legalMove
        }
    }

    /**
     * Updates game state and view.
     */
    update() {
        if (this.#gameMode === E_GameMode.AUTOMATIC) {
            this.#runGameAutomatically();
        }
        this.#updateInput();
        this.#draw();


    }

    /**
     * Sets mode in which the game is playing.
     * STANDARD: Standard chess with all moves. Player makes moves on board.
     * AUTOMATIC: The machine will make random moves automatically until the game is finished. No draw offers.
     * FREE: Any color can move. Board might have a legal configuration or not. No end game. No option for resigning nor draw offers. Player makes moves on board.
     * @param {E_GameMode} gameMode 
     */
    setGameMode(gameMode) {
        assert(Object.values(E_GameMode).includes(gameMode), "Invalid game mode");
        this.#gameMode = gameMode;
        this.#generateLegalMoves();
        this.update();
    }

    #updateInput() {
        switch (this.#gameMode) {
            case E_GameMode.STANDARD:
                this.#moveInput.enabled = !this.isGameFinished();
                break;
            case E_GameMode.AUTOMATIC:
                this.#moveInput.enabled = false;
                break;
            case E_GameMode.FREE:
                this.#moveInput.enabled = true;
                break;
        }
    }

    #runGameAutomatically() {
        if (this.isGameFinished()) return;
        this.#timerToMove += deltaTime;
        if (this.#timeToMakeMove < this.#timerToMove) {
            let randomIndex = Math.floor(random(0, this.#legalMoves.length));
            let randomMove = this.#legalMoves[randomIndex];
            this.#moveRecord.recordMove(randomMove, this.#board, this.playingColor);
            this.#board.makeMove(randomMove);
            this.#switchPlayingColor();
            this.#legalMoves = this.#board.generateMoves(this.playingColor);
            this.#checkEndGame(this.#playingColor);
            this.#timerToMove = 0;
        }
    }

    #draw() {
        this.#graphics.background(255);

        this.#moveRecordUI.draw(this.#graphics);
        this.#piecesCapturedUI.draw(this.#graphics);

        if (this.#gameMode !== E_GameMode.FREE) {
            this.#gameStateUI.draw(this.#graphics);
        }

        this.#moveInputUI.draw(this.#graphics);
        this.#board.draw(this.#graphics);

        this.#drawRanksAndFiles(this.#graphics);

        this.#updateResignButton();

        image(this.#graphics, this.#position.x, this.#position.y);
    }


    #onMoveInput(event) {
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
            if (this.#gameMode === E_GameMode.STANDARD) this.#switchPlayingColor();
            //generate new set of legal moves
            this.#generateLegalMoves();
            //check for end game conditions
            if (this.#gameMode !== E_GameMode.FREE) this.#checkEndGame(this.#playingColor);
        }
    }

    #switchPlayingColor() {
        this.#playingColor = OppositePieceColor(this.#playingColor);
    }

    #generateLegalMoves() {
        this.#legalMoves = this.#board.generateMoves(this.#playingColor);
        if (this.#gameMode === E_GameMode.FREE) {
            this.#legalMoves = this.#legalMoves.concat(this.#board.generateMoves(OppositePieceColor(this.playingColor)));
        }
    }

    #checkEndGame(playingColor) {
        //if there are no moves left
        let legalMoves = this.#board.generateMoves(playingColor);
        if (legalMoves.length === 0) {
            //and king is in check
            if (this.#board.isKingInCheck(playingColor)) {
                //game finished by checkmate
                this.#gameState = E_GameState.CHECKMATE;
            }
            else {
                //game finished by stalemate
                this.#gameState = E_GameState.STALEMATE;
            }
        } else {
            //this.#checkDraw();
        }
    }

    #checkDraw() {
        if (false) {
            this.#gameState = E_GameState.DRAW;
        }
    }

    #createResignButton() {
        let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
        button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
        button.mouseClicked(() => {
            this.#gameState = E_GameState.RESIGNED;
            button.hide();
        });
        this.#resignButton = button;
    }

    #updateResignButton() {
        if (this.isGameFinished() || this.#gameMode === E_GameMode.FREE) {
            this.#resignButton.hide();
        } else {
            this.#resignButton.show();
        }
    }

    #drawRanksAndFiles(graphics) {
        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.RANKS,
            {
                x: BOARD_LOCAL_POSITION.x - RANKS_FILES_UI_SETTING.CELL_LENGTH,
                y: BOARD_LOCAL_POSITION.y,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0

            });

        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.FILES,
            {
                x: BOARD_LOCAL_POSITION.x,
                y: BOARD_LOCAL_POSITION.y + BOARD_HEIGHT,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0
            });
    }

} 