
//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const STANDARD_NO_KINGS_FEN = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR';
//BOARDS
let standardBoard;
let customBoard;
let displayBoard;

//QUADRILLE SETTINGS
Quadrille.cellLength = 40;

//GAME SETTINGS
let gameFinished = false;
var playingColor = E_PieceColor.White;
let legalMoves = [];

//GAME STATES 
const E_GAME_STATE = Object.freeze({
    PLAYING: Symbol("Playing"),
    CHECKMATE: Symbol("Checkmate"),
    STALEMATE: Symbol("Stalemate"),
    DRAW: Symbol("Draw"),
    RESIGNED: Symbol("Resigned"),
});
let gameState = E_GAME_STATE.PLAYING;


//RANDOM PLAY SETTINGS
let timer = 0;
let timeToMakeMove = 50;

//OBJECTS
let moveInputUI;
let moveRecord;


function setup() {
    createCanvas(windowWidth, windowHeight);

    standardBoard = new Board(STANDARD_BOARD_FEN);
    customBoard = new Board('3R3R/8/8/R2Q3Q/8/8/8/R2Q3Q');
    displayBoard = standardBoard;

    legalMoves = displayBoard.generateMoves(playingColor);

    moveInputUI = new MoveInputUI();//****** Board UI should register events first so it works

    MoveInput.setBoard(displayBoard);
    MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, onMoveInput);

    moveRecord = new MoveRecord();
    moveRecordUI = new MoveRecordUI(moveRecord);

    createResignButton();
}

function draw() {
    background(255);
    moveInputUI.draw();
    displayBoard.draw();
    moveRecordUI.draw();
    drawPiecesCapturedUI();
    drawGameStateUI();
    //runGame(displayBoard);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function onMoveInput(event) {
    //get input move
    let inputMove = event.detail.move;

    //if input move is legal
    let result = isMoveLegal(inputMove);
    if (result.isLegal) {
        let legalMove = result.move;
        //record move
        moveRecord.recordMove(legalMove, displayBoard, playingColor);
        //make move on board
        displayBoard.makeMove(legalMove);
        //switch playing color
        SwitchPlayingColor();
        //generate new set of legal moves
        legalMoves = displayBoard.generateMoves(playingColor);
        //check for end game conditions
        if (legalMoves.length === 0) {
            gameFinished = true;
            if (displayBoard.isKingInCheck(playingColor)) {
                gameState = E_GAME_STATE.CHECKMATE;
            }
            else {
                gameState = E_GAME_STATE.STALEMATE;
            }
            return;
        }
    }
}

function isMoveLegal(inputMove) {
    let isSameMove = (move) => {
        return inputMove.startRank === move.startRank &&
            inputMove.startFile === move.startFile &&
            inputMove.endRank === move.endRank &&
            inputMove.endFile === move.endFile;
    };
    let legalMove = legalMoves.find(isSameMove);
    let isLegal = legalMove !== undefined;
    return {
        isLegal: isLegal,
        move: legalMove
    }
}

function SwitchPlayingColor() {
    playingColor = OppositePieceColor(playingColor);
}


function runGame(board) {
    timer += deltaTime;
    if (timeToMakeMove < timer && !gameFinished) {
        let moves = board.generateMoves(playingColor);
        if (moves.length === 0) {
            gameFinished = true;
            if (board.isKingInCheck(playingColor)) {
                gameState = E_GAME_STATE.CHECKMATE;
            }
            else {
                gameState = E_GAME_STATE.STALEMATE;
            }

            return;
        }
        let randomIndex = Math.floor(random(0, moves.length));
        let randomMove = moves[randomIndex];
        moveRecord.recordMove(randomMove, displayBoard, playingColor);
        board.makeMove(randomMove);

        SwitchPlayingColor();
        timer = 0;
    }
}


function drawPiecesCapturedUI() {
    textSize(PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE);
    fill(color(0));
    textAlign(LEFT, TOP);

    text(displayBoard.getCapturedPieces(E_PieceColor.White),
        PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.x,
        PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.y);

    text(displayBoard.getCapturedPieces(E_PieceColor.Black),
        PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.x,
        PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.y);

    textAlign(LEFT, BOTTOM);
}

function drawGameStateUI() {
    let rectFillTargetColour;
    let textColor;
    let message;

    switch (gameState) {
        case E_GAME_STATE.PLAYING:
            rectFillTargetColour = playingColor === E_PieceColor.White ? color(255) : color(0);
            textColor = playingColor === E_PieceColor.White ? color(0) : color(255);
            message = playingColor === E_PieceColor.White ? "White Moves" : "Black Moves";
            break;
        case E_GAME_STATE.CHECKMATE:
            rectFillTargetColour = OppositePieceColor(playingColor) === E_PieceColor.White ? color(255) : color(0);
            textColor = OppositePieceColor(playingColor) === E_PieceColor.White ? color(0) : color(255);
            message = "Checkmate! " + (OppositePieceColor(playingColor) === E_PieceColor.White ? "White Wins" : "Black Wins");
            break;
        case E_GAME_STATE.RESIGNED:
            rectFillTargetColour = OppositePieceColor(playingColor) === E_PieceColor.White ? color(255) : color(0);
            textColor = OppositePieceColor(playingColor) === E_PieceColor.White ? color(0) : color(255);
            message = (OppositePieceColor(playingColor) === E_PieceColor.White ? "White Wins" : "Black Wins");
            break;
        case E_GAME_STATE.STALEMATE:
            rectFillTargetColour = color(175);
            textColor = color(0);
            message = "Stalemate!";
            break;
        case E_GAME_STATE.DRAW:
            rectFillTargetColour = color(175);
            textColor = color(0);
            message = "Draw!";
            break;
    }

    let rectCenter = GAME_STATE_UI_SETTINGS.POSITION.x + BOARD_WIDTH / 2;
    noStroke();
    fill(rectFillTargetColour);
    rect(GAME_STATE_UI_SETTINGS.POSITION.x,
        GAME_STATE_UI_SETTINGS.POSITION.y,
        GAME_STATE_UI_SETTINGS.WIDTH,
        GAME_STATE_UI_SETTINGS.HEIGHT);

    textSize(GAME_STATE_UI_SETTINGS.TEXT_SIZE);
    fill(textColor)
    textStyle(BOLD);
    textAlign(CENTER, TOP);

    text(message,
        rectCenter,
        GAME_STATE_UI_SETTINGS.POSITION.y + GAME_STATE_UI_SETTINGS.TEXT_MARGIN);

    textStyle(NORMAL);
    textAlign(LEFT, BOTTOM);

}

function createResignButton() {
    let button = createButton("Resign");
    button.position(RESIGN_BUTTON_SETTINGS.POSITION.x, RESIGN_BUTTON_SETTINGS.POSITION.y);
    button.mouseClicked(() => {
        gameState = E_GAME_STATE.RESIGNED;
        gameFinished = true;
        button.hide();
    });
}








