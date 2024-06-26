var Board = Chess.Board;
var E_PieceColor = Chess.E_PieceColor;
var E_PieceType = Chess.E_PieceType;
var E_MoveFlag = Chess.E_MoveFlag;
var OppositePieceColor = Chess.ChessUtils.OppositePieceColor;
var MoveToString = Chess.ChessUtils.MoveToString;
var pieceColorTypeToKey = Chess.ChessUtils.pieceColorTypeToKey;


export function runPerftTest(testPosition) {
    let board = new Board(testPosition.fen);
    for (let i = 0; i < testPosition.positions.length; i++) {
        console.log("Depth: " + (i + 1) + "  Result: " + perftTest(board, i + 1) + "  Expected: " + testPosition.positions[i]);
    }
}

/**
 *
 * @param {Board} board
 * @param {number} depth
 */
export function perftTest(board, depth, debug = false, playingColor = E_PieceColor.White) {
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
        let positions = perftTest(board, depth - 1, false, playingColor);
        numberOfPositions += positions;
        board.unmakeMove();
        playingColor = OppositePieceColor(playingColor);

        if (debug) {
            console.log(MoveToString(move) + " " + positions + "\n");
        }
    }

    return numberOfPositions;
}

/**
 * 
 * @param {Promotion} promotion 
 * @param {Board} board 
 * @param {number} depth 
 * @param {boolean} debug 
 * @param {E_PieceColor} playingColor 
 * @returns 
 */
function perftTestPromotion(promotion, board, depth, debug, playingColor = E_PieceColor.White) {
    let typesToPromote = [E_PieceType.Knight, E_PieceType.Bishop, E_PieceType.Rook, E_PieceType.Queen];
    let numberOfPositions = 0;
    for (let pieceType of typesToPromote) {
        let promotionString = MoveToString(promotion) + pieceColorTypeToKey(playingColor, pieceType);
        promotion.newPieceType = pieceType;
        board.makeMove(promotion);
        playingColor = OppositePieceColor(playingColor);
        let positions = perftTest(board, depth - 1, false, playingColor);
        numberOfPositions += positions;
        board.unmakeMove();
        playingColor = OppositePieceColor(playingColor);

        if (debug) {
            console.log(promotionString + " " + positions + "\n");
        }
    }

    return numberOfPositions;

}

//--ASYNC-
//var asyncDebugWaitTime = 300;


// async function runPerftTestAsync(board) {
//     await sleep(1000);
//     for (let i = 0; i < resultsInitialPosition.length; i++) {
//         let result = await perftTestAsync(board, i);
//         console.log("Depth: " + (i) + "  Result: " + result + "  Expected: " + resultsInitialPosition[i]);
//     }
// }


// /**
//  *
//  * @param {Board} board
//  * @param {number} depth
//  */
// async function perftTestAsync(board, depth) {
//     if (depth == 0) {
//         return 1;
//     }

//     let moves = board.generateMoves(playingColor);
//     let numberOfPositions = 0;
//     await sleep(asyncDebugWaitTime);

//     for (let move of moves) {
//         board.makeMove(move);
//         await sleep(asyncDebugWaitTime);
//         playingColor = OppositePieceColor(playingColor);
//         numberOfPositions += await perftTestAsync(board, depth - 1);
//         board.unmakeMove();
//         await sleep(asyncDebugWaitTime);
//         playingColor = OppositePieceColor(playingColor);
//     }

//     return numberOfPositions;
// }

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }