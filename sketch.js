
let game;
let FEN = "1R2k3/R7/8/8/8/8/8/K"
function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new Chess.Game(windowWidth / 3, 10);
    game.setGameMode(Chess.E_GameMode.FREE);
}

function draw() {
    game.update();
}