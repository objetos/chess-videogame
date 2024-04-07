const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';

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

let customBoard;
let standardBoard;
let gameBoard;

Quadrille.cellLength = 40;
let timer = 0;
let input;
let timeToMakeMove = 10;
let gameFinished = false;
var playingColor = E_PieceColor.White;

let legalMoves = [];


function setup() {
    createCanvas(Quadrille.cellLength * 8, Quadrille.cellLength * 8);
    customBoard = new Board("8/8/8/4k3/3K4/8/8/8");
    standardBoard = new Board(STANDARD_BOARD_FEN);
    gameBoard = standardBoard;
    legalMoves = gameBoard.generateMoves(playingColor);
    Input.instance.addEventListener("user:move-input", onMoveInput);
}

function draw() {
    background(255);
    gameBoard.draw();
    //runGame(gameBoard);
}

function onMoveInput(event) {
    let inputMove = event.detail.move;
    let isSameMove = (move) => {
        return inputMove.startRank === move.startRank &&
            inputMove.startFile === move.startFile &&
            inputMove.endRank === move.endRank &&
            inputMove.endFile === move.endFile;
    }
    let legalMove = legalMoves.find(isSameMove);
    if (legalMove !== undefined) {
        gameBoard.makeMove(legalMove);

        SwitchPlayingColor();
        legalMoves = gameBoard.generateMoves(playingColor);
        console.log(legalMoves.length)
        if (legalMoves.length === 0) {
            gameFinished = true;
            if (gameBoard.isKingInCheck(playingColor)) console.log("Checkmate! " + OppositePieceColor(playingColor).toString() + " wins.");
            else console.log("Stalemate!");
            return;
        }
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








