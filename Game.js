
//fens
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const STANDARD_NO_KINGS_FEN = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR';

class BoardPosition {
    fen;
    numberOfWhiteMoves;
    numberOfBlackMoves;

    constructor(fen, numberOfWhiteMoves, numberOfBlackMoves) {
        this.fen = fen;
        this.numberOfWhiteMoves = numberOfWhiteMoves;
        this.numberOfBlackMoves = numberOfBlackMoves;
    }
}

var CUSTOM_POSITIONS = {
    "EMPTY_BOARD": new BoardPosition('8/8/8/8/8/8/8/8', 0, 0),
    "KING_MOVES_AWAY_FROM_SLIDER": new BoardPosition('8/8/8/1R3k2/8/8/8/8', 12, 6),
    "CHECK_MATE": new BoardPosition('Q6k/8/8/8/3B4/8/8/7Q', 53, 0),
    "CHECK_BY_PROTECTED_QUEEN_SLIDER_DISTANT": new BoardPosition('7K/6q1/8/1k6/8/2b5/8/8', 0),
    "CHECK_BY_PROTECTED_QUEEN_SLIDER_CLOSE": new BoardPosition('1r3n1K/1p4q1/5b2/1k6/7B/2b5/8/4B3', 0),
    "CHECK_BY_PROTECTED_QUEEN_KNIGHT": new BoardPosition('1r5K/1p4q1/4n3/1k6/7B/8/8/4B3', 0),
    "CHECK_BY_PROTECTED_QUEEN_PAWN": new BoardPosition('8/8/4p1K1/5q2/8/8/8/8', 2),
    "CHECK_BY_UNPROTECTED_QUEEN_BP": new BoardPosition('7K/6q1/5p2/1k6/8/2b5/8/8', 1),
    "CHECK_BY_UNPROTECTED_QUEEN_WR": new BoardPosition('7K/1p4q1/8/1k2R3/8/2b5/8/8', 1),
    "PINNED_PIECES_1": new BoardPosition('8/4r3/8/4N3/q1P1K3/5Q2/8/7b', 8),
    "PINNED_PIECES_2": new BoardPosition('2q3b1/8/2P1B3/8/2K1B1r1/2R5/8/2q5', 13),
    "ONE_CHECKER": new BoardPosition('7k/5p2/4n3/7r/3B4/8/7b/4q3', undefined, 8),
    "MANY_CHECKERS": new BoardPosition('8/4n3/R3k3/R7/7q/8/1b2Q3/8', undefined, 2),
    "BLOCKING_CHECKMATE": new BoardPosition('rnbqkbnr/pppppppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR', 3),
    "CASTLING": new BoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3K2R', 25),
    "BLOCKED_CASTLING": new BoardPosition('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KB1R', 22),
    "CASTLING_CHECKED_PATH_RIGHT": new BoardPosition('rnb1kbnr/pppppqpp/8/8/8/8/PPPPP1PP/R3K2R', 21),
    "CASTLING_CHECKED_PATH_LEFT": new BoardPosition('rnbqkbnr/ppp1pppp/8/8/8/8/PP2P1PP/R3K1NR', 17),
    "CASTLING_ROOK_PATH_CHECKED": new BoardPosition('rnb1kbnr/pqpppppp/8/8/8/8/P1PPP1PP/R3K2R', 22),
    "KING_MOVES_NEAR_PAWN": new BoardPosition('8/3p4/8/2K5/8/8/8/8', 7),
    "CASTLING_RIGTHS_TEST": new BoardPosition("r3k2r/8/8/8/8/8/8/R3K2R"),
    "EN_PASSANT_TEST": new BoardPosition('rnbqkbnr/pppppppp/8/4P3/8/8/PPPP1PPP/RNBQKBNR'),
    "KIWIPET": new BoardPosition('r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R', 48),
    "POS3": new BoardPosition('8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8', 14),
    "POS4": new BoardPosition('r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1', 6),
    "POS5": new BoardPosition('rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R', 41),
}

//boards
let standardBoard;
let customBoard;
let displayBoard;

//quadrille settings
Quadrille.cellLength = 40;

//board display settings
const BOARD_POSITION = { x: 100, y: 100 };
const BOARD_SQUARE_SIZE = Quadrille.cellLength;

//game settings
let timer = 0;
let timeToMakeMove = 25;
let gameFinished = false;
var playingColor = E_PieceColor.White;
let legalMoves = [];

//objects
let moveInputUI;
let moveRecord;


function setup() {
    createCanvas(screen.availWidth, screen.availHeight);

    standardBoard = new Board(STANDARD_BOARD_FEN);
    customBoard = new Board('3R3R/8/8/R2Q3Q/8/8/8/R2Q3Q');
    displayBoard = standardBoard;

    legalMoves = displayBoard.generateMoves(playingColor);

    moveInputUI = new MoveInputUI();//****** Board UI should register events first so it works

    MoveInput.setBoard(displayBoard);
    MoveInput.addInputEventListener(MoveInput.E_InputEvents.MoveInput, onMoveInput);

    moveRecord = new MoveRecord();
}

function draw() {
    background(255);
    moveInputUI.draw();
    displayBoard.draw();
    //runGame(displayBoard);
}

function onMoveInput(event) {
    //get input move
    let inputMove = event.detail.move;

    //if input move is legal
    let result = isMoveLegal(inputMove);
    if (result.isLegal) {
        let legalMove = result.move;
        //record move
        console.log(moveRecord.recordMove(legalMove, displayBoard, playingColor));
        //make move on board
        displayBoard.makeMove(legalMove);
        //switch playing color
        SwitchPlayingColor();
        //generate new set of legal moves
        legalMoves = displayBoard.generateMoves(playingColor);
        //check for end game conditions
        if (legalMoves.length === 0) {
            gameFinished = true;
            if (displayBoard.isKingInCheck(playingColor)) console.log("Checkmate! " + OppositePieceColor(playingColor).toString() + " wins.");
            else console.log("Stalemate!");
            return;
        }
    }
}

function isMoveLegal(inputMove, legalMove) {
    let isSameMove = (move) => {
        return inputMove.startRank === move.startRank &&
            inputMove.startFile === move.startFile &&
            inputMove.endRank === move.endRank &&
            inputMove.endFile === move.endFile;
    };
    legalMove = legalMoves.find(isSameMove);
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
            if (board.isKingInCheck(playingColor)) console.log("Checkmate! " + OppositePieceColor(playingColor).toString() + " wins.");
            else console.log("Stalemate!");
            return;
        }
        let randomIndex = Math.floor(random(0, moves.length));
        let randomMove = moves[randomIndex];
        board.makeMove(randomMove);

        if (playingColor === E_PieceColor.White) {
            playingColor = E_PieceColor.Black;
        } else {
            playingColor = E_PieceColor.White;
        }
        timer = 0;
    }
}

function testBoardPositions() {
    console.log("Testing Move Generator with Custom Positions \n");
    for (let boardPositionName of Object.keys(CUSTOM_POSITIONS)) {
        let passed = true;
        let boardPosition = CUSTOM_POSITIONS[boardPositionName];
        let board = new Board(boardPosition.fen);
        let whiteMoves = board.generateMoves(E_PieceColor.White);
        let blackMoves = board.generateMoves(E_PieceColor.Black);
        console.log("Position Name:" + boardPositionName + "\n");
        if (boardPosition.numberOfWhiteMoves !== undefined) {
            if (whiteMoves.length !== boardPosition.numberOfWhiteMoves) {
                passed = false;
                console.log("FAILED. Incorrect number of White Moves. Real:" + boardPosition.numberOfWhiteMoves + ". Result:" + whiteMoves.length + ".\n");
            }
        }

        if (boardPosition.numberOfBlackMoves !== undefined) {
            if (blackMoves.length !== boardPosition.numberOfBlackMoves) {
                passed = false;
                console.log("FAILED. Incorrect number of Black Moves. Real:" + boardPosition.numberOfBlackMoves + ". Result:" + blackMoves.length + ".\n");
            }
        }

        if (passed) console.log("PASSED");
        console.log("------------------------")
    }
}








