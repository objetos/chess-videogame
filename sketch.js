
let game;
function setup() {
    createCanvas(windowWidth, windowHeight);
    game = new myBuild.default(100, 50);
}

function draw() {
    //fill(color(128));
    //rect(GAME_STATE_UI_SETTINGS.POSITION.x, GAME_STATE_UI_SETTINGS.POSITION.y, GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT)
    game.draw();
}
