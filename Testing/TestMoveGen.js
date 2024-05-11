import { runPerftTest, perftTest } from "./PerftTesting.js";
import { testCustomBoardPositions } from "./TestBoardPositions.js";

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

window.runFullSuite = runFullSuite;
window.perftTest = perftTest;
window.runPerftTest = runPerftTest;
window.wikiTestPositions = wikiTestPositions;
