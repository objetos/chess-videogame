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



function runFullSuite() {
    testCustomBoardPositions();
    for (let position of Object.keys(wikiTestPositions)) {
        console.log("FULL PERFT OF POSITION: " + position)
        runPerftTest(wikiTestPositions[position]);
    }
}

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
        MoveInput.pieceSelectedForPromotion = pieceType;
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

function testCustomBoardPositions() {
    console.log("Testing Move Generator with Custom Positions \n");
    let passed = true;
    for (let boardPositionName of Object.keys(CUSTOM_POSITIONS)) {
        let boardPosition = CUSTOM_POSITIONS[boardPositionName];
        let board = new Board(boardPosition.fen);
        let whiteMoves = board.generateMoves(E_PieceColor.White);
        let blackMoves = board.generateMoves(E_PieceColor.Black);
        if (boardPosition.numberOfWhiteMoves !== undefined) {
            if (whiteMoves.length !== boardPosition.numberOfWhiteMoves) {
                passed = false;
                console.log("Position Name:" + boardPositionName + "\n");
                console.log("FAILED. Incorrect number of White Moves. Real:" + boardPosition.numberOfWhiteMoves + ". Result:" + whiteMoves.length + ".\n");
                console.log("------------------------")

            }
        }

        if (boardPosition.numberOfBlackMoves !== undefined) {
            if (blackMoves.length !== boardPosition.numberOfBlackMoves) {
                passed = false;
                console.log("FAILED. Incorrect number of Black Moves. Real:" + boardPosition.numberOfBlackMoves + ". Result:" + blackMoves.length + ".\n");
                console.log("------------------------")

            }
        }

    }

    if (passed) console.log("PASSED");
}


