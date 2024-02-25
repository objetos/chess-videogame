const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const EMPTY_BOARD = '8/8/8/8/8/8/8/8';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const CUSTOM_BOARD = "rnbq3r/pp1p3p/3b2Rn/2p1kpN1/7P/N1Q1B3/PPP1PPP1/3RKB2";
const KING_MOVES_AWAY_FROM_SLIDER = '8/8/8/1R3k2/8/8/8/8';
const CHECK_MATE = 'Q6k/8/8/8/3B4/8/8/7Q';
const CHECKMATE_AFTER_CAPTURE_1 = '7K/6q1/8/1k6/8/2b5/8/8';
const CHECKMATE_AFTER_CAPTURE_2 = '7K/6q1/5p2/1k6/8/2b5/8/8';
const CHECKMATE_AFTER_CAPTURE_3 = '7K/1p4q1/8/1k2R3/8/2b5/8/8';
const CHECKMATE_AFTER_CAPTURE_4 = '1r3n1K/1p4q1/5b2/1k6/7B/2b5/8/4B3';
const CHECKMATE_AFTER_CAPTURE_5 = '1r5K/1p4q1/4n3/1k6/7B/8/8/4B3';
const CHECKMATE_AFTER_CAPTURE_6 = '8/8/4p1K1/5q2/8/8/8/8';
const PINNED_PIECES_1 = '8/4r3/8/4N3/q1P1K3/5Q2/8/7b';
const PINNED_PIECES_2 = '2q3b1/8/2P1B3/8/2K1B1r1/2R5/8/2q5';
const ONE_CHECKER = '7k/5p2/4n3/7r/3B4/8/7b/4q3';
const MANY_CHECKERS = '8/4n3/R3k3/R7/7q/8/1b2Q3/8';
const BLOCKING_CHECKMATE = 'rnbqkbnr/pppppppp/8/8/4q3/8/PPPP1PPP/RNBQKBNR';
const CASTLING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3K2R';
const BLOCKED_CASTLING = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/R3KB1R';
const CASTLING_CHECKED_PATH_RIGHT = 'rnb1kbnr/pppppqpp/8/8/8/8/PPPPP1PP/R3K2R';
const CASTLING_CHECKED_PATH_LEFT = 'rnbqkbnr/ppp1pppp/8/8/8/8/PP2P1PP/R3K1NR';
const CASTLING_ROOK_PATH_CHECKED = 'rnb1kbnr/pqpppppp/8/8/8/8/P1PPP1PP/R3K2R';
const KING_MOVES_NEAR_PAWN = '8/3p4/8/2K5/8/8/8/8';

let board;

Quadrille.cellLength = 50;
let timer = 0;
let timeToMakeMove = 50;
let playingColor = E_PieceColor.White;
let gameFinished = false;

function setup() {
    createCanvas(Quadrille.cellLength * 8, Quadrille.cellLength * 8);
    board = new Board(KING_MOVES_NEAR_PAWN);
}

function draw() {
    background(255);
    board.Draw();
    //RunGame(board);
}

function RunGame(board) {
    timer += deltaTime;
    if (timeToMakeMove < timer && !gameFinished) {
        let moves = board.GenerateMoves(playingColor);
        if (moves.length === 0) {
            gameFinished = true;
            return;
        }
        let randomIndex = Math.floor(random(0, moves.length));
        let randomMove = moves[randomIndex];
        board.MakeMove(randomMove);

        if (playingColor === E_PieceColor.White) {
            playingColor = E_PieceColor.Black;
        } else {
            playingColor = E_PieceColor.White;
        }
        timer = 0;
    }
}








