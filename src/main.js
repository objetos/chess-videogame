import Game from "./Game.js";
let game;
export function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new Game(100, 50);
}

export function draw() {
    //fill(color(128));
    //rect(GAME_STATE_UI_SETTINGS.POSITION.x, GAME_STATE_UI_SETTINGS.POSITION.y, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT)
    game.draw();
}



