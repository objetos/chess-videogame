var asyncDebugWaitTime = 300;

var wikiTestPositions = {
    standard: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
        positions: [20, 400, 8902, 197281]
    },
    pos2_kiwipet: {
        fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R',
        positions: [48, 2039, 97862, 4085603]
    },
    pos3: {
        fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8',
        positions: [14, 191, 2812, 43238, 674624]
    },
    pos4: {
        fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1',
        positions: [6, 264, 9467, 422333]
    },
    pos5: {
        fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R',
        positions: [44, 1486, 62379, 2103487]
    },
    pos6: {
        fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1',
        positions: [46, 2079, 89890, 3894594]
    }
}

var petertestPositions = [
    {
        "depth": 1,
        "nodes": 8,
        "fen": "r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2"
    },
    {
        "depth": 1,
        "nodes": 8,
        "fen": "8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3"
    },
    {
        "depth": 1,
        "nodes": 19,
        "fen": "r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2"
    },
    {
        "depth": 1,
        "nodes": 5,
        "fen": "r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2"
    },
    {
        "depth": 1,
        "nodes": 44,
        "fen": "2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2"
    },
    {
        "depth": 1,
        "nodes": 39,
        "fen": "rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9"
    },
    {
        "depth": 1,
        "nodes": 9,
        "fen": "2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4"
    },
    {
        "depth": 3,
        "nodes": 62379,
        "fen": "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"
    },
    {
        "depth": 3,
        "nodes": 89890,
        "fen": "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"
    },
    {
        "depth": 6,
        "nodes": 1134888,
        "fen": "3k4/3p4/8/K1P4r/8/8/8/8 b - - 0 1"
    },
    {
        "depth": 6,
        "nodes": 1015133,
        "fen": "8/8/4k3/8/2p5/8/B2P2K1/8 w - - 0 1"
    },
    {
        "depth": 6,
        "nodes": 1440467,
        "fen": "8/8/1k6/2b5/2pP4/8/5K2/8 b - d3 0 1"
    },
    {
        "depth": 6,
        "nodes": 661072,
        "fen": "5k2/8/8/8/8/8/8/4K2R w K - 0 1"
    },
    {
        "depth": 6,
        "nodes": 803711,
        "fen": "3k4/8/8/8/8/8/8/R3K3 w Q - 0 1"
    },
    {
        "depth": 4,
        "nodes": 1274206,
        "fen": "r3k2r/1b4bq/8/8/8/8/7B/R3K2R w KQkq - 0 1"
    },
    {
        "depth": 4,
        "nodes": 1720476,
        "fen": "r3k2r/8/3Q4/8/8/5q2/8/R3K2R b KQkq - 0 1"
    },
    {
        "depth": 6,
        "nodes": 3821001,
        "fen": "2K2r2/4P3/8/8/8/8/8/3k4 w - - 0 1"
    },
    {
        "depth": 5,
        "nodes": 1004658,
        "fen": "8/8/1P2K3/8/2n5/1q6/8/5k2 b - - 0 1"
    },
    {
        "depth": 6,
        "nodes": 217342,
        "fen": "4k3/1P6/8/8/8/8/K7/8 w - - 0 1"
    },
    {
        "depth": 6,
        "nodes": 92683,
        "fen": "8/P1k5/K7/8/8/8/8/8 w - - 0 1"
    },
    {
        "depth": 6,
        "nodes": 2217,
        "fen": "K1k5/8/P7/8/8/8/8/8 w - - 0 1"
    },
    {
        "depth": 7,
        "nodes": 567584,
        "fen": "8/k1P5/8/1K6/8/8/8/8 w - - 0 1"
    },
    {
        "depth": 4,
        "nodes": 23527,
        "fen": "8/8/2k5/5q2/5n2/8/5K2/8 b - - 0 1"
    }
]


function runPerftTest(testPosition) {
    let board = new Board(testPosition.fen);
    for (let i = 0; i < testPosition.positions.length; i++) {
        console.log("Depth: " + (i + 1) + "  Result: " + perftTest(board, i + 1) + "  Expected: " + testPosition.positions[i]);
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
function perftTest(board, depth, debug = false, playingColor = E_PieceColor.White) {
    if (depth == 0) {
        return 1;
    }

    let moves = board.generateMoves(playingColor);
    let numberOfPositions = 0;

    for (let move of moves) {
        if (move.flag === E_MoveFlag.Promotion) {
            numberOfPositions += perftTestPromotion(move, board, depth, debug, playingColor);
            continue;
        }
        board.makeMove(move);
        playingColor = OppositePieceColor(playingColor);
        let positions = perftTest(board, depth - 1, false, playingColor, move);
        numberOfPositions += positions;
        board.unmakeMove();
        playingColor = OppositePieceColor(playingColor);

        if (debug) {
            console.log(MoveToString(move) + " " + positions + "\n");
        }
    }

    return numberOfPositions;
}

function perftTestPromotion(promotion, board, depth, debug, playingColor = E_PieceColor.White) {
    let typesToPromote = [E_PieceType.Knight, E_PieceType.Bishop, E_PieceType.Rook, E_PieceType.Queen];
    let numberOfPositions = 0;
    for (let pieceType of typesToPromote) {
        let promotionString = MoveToString(promotion) + pieceColorTypeToString(playingColor, pieceType);
        Input.pieceSelectedForPromotion = pieceType;
        board.makeMove(promotion);
        playingColor = OppositePieceColor(playingColor);
        let positions = perftTest(board, depth - 1, false, playingColor, promotion);
        numberOfPositions += positions;
        board.unmakeMove();
        playingColor = OppositePieceColor(playingColor);

        if (debug) {
            console.log(promotionString + " " + positions + "\n");
        }
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
/**
 * 
 * @param {Move} move 
 */
function MoveToString(move) {
    let startFileLetter = FileToLetter(move.startFile);
    let endFileLetter = FileToLetter(move.endFile);
    return startFileLetter + move.startRank + endFileLetter + move.endRank;
}

function FileToLetter(file) {
    return String.fromCharCode(96 + file);
}
