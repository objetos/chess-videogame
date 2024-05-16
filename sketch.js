//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const STANDARD_NO_KINGS_FEN = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR';
const CUSTOM_FEN = '8/1P2P2P/8/8/8/8/2p1p1p1/8';

let game;
function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new Chess.Game(windowWidth / 3, 10, STANDARD_BOARD_FEN);
    game.setGameMode(Chess.E_GameMode.AUTOMATIC);
    game.automaticMovesTimeInterval = 200;
}

function draw() {
    game.update();
}