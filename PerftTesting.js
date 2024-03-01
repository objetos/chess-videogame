var asyncDebugWaitTime = 300;
var resultsInitialPosition = [1, 20, 400, 8902, 197281, 4865609, 119060324, 3195901860, 84998978956];
//var resultsPosition5 = [44	1, 486	62, 379	2, 103, 487	89, 941, 194]


function runPerftTest(board) {
    for (let i = 0; i < resultsInitialPosition.length; i++) {
        console.log("Depth: " + (i) + "  Result: " + perftTest(board, i) + "  Expected: " + resultsInitialPosition[i]);
    }
}

async function runPerftTestAsync(board) {
    await sleep(1000);
    for (let i = 0; i < resultsInitialPosition.length; i++) {
        let result = await perftTestAsync(board, i);
        console.log("Depth: " + (i) + "  Result: " + result + "  Expected: " + resultsInitialPosition[i]);
    }
}


/**
 *
 * @param {Board} board
 * @param {Number} depth
 */
function perftTest(board, depth) {
    if (depth == 0) {
        return 1;
    }

    let moves = board.generateMoves(playingColor);
    let numberOfPositions = 0;

    for (let move of moves) {
        board.makeMove(move);
        playingColor = OppositePieceColor(playingColor);
        numberOfPositions += perftTest(board, depth - 1);
        board.unmakeMove();
        playingColor = OppositePieceColor(playingColor);
    }

    return numberOfPositions;
}

/**
 *
 * @param {Board} board
 * @param {Number} depth
 */
async function perftTestAsync(board, depth) {
    if (depth == 0) {
        return 1;
    }

    let moves = board.generateMoves(playingColor);
    let numberOfPositions = 0;
    await sleep(asyncDebugWaitTime);

    for (let move of moves) {
        board.makeMove(move);
        await sleep(asyncDebugWaitTime);
        playingColor = OppositePieceColor(playingColor);
        numberOfPositions += await perftTestAsync(board, depth - 1);
        board.unmakeMove();
        await sleep(asyncDebugWaitTime);
        playingColor = OppositePieceColor(playingColor);
    }

    return numberOfPositions;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

