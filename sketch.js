//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const JUST_PAWNS_FEN = '8/pppppppp/8/8/8/8/PPPPPPPP/8';
const JUST_KINGS_FEN = '4k3/8/8/8/8/8/8/4K3';
const STANDARD_NO_KINGS_FEN = 'rnbq1bnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQ1BNR';

let game;
function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new webBuild.Game(windowWidth / 3, 10);
    game.setGameMode(webBuild.E_GameMode.STANDARD);
}

function draw() {
    //fill(color(128));
    //rect(GAME_STATE_UI_SETTINGS.POSITION.x, GAME_STATE_UI_SETTINGS.POSITION.y, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT)
    game.update();
}