const MoveRecord = require("./src/MoveRecord.js");
const Move = require("./MoveGeneration/Move.js");
const E_MoveFlag = require("./Enums/E_MoveFlag.js");
const moveRecord = new MoveRecord();
let queenSideCastling = new Move(1, 1, 2, 2, E_MoveFlag.QueenSideCastling);
let kingSideCastling = new Move(1, 1, 2, 2, E_MoveFlag.KingSideCastling);

test('Castling moves work', () => {
    expect(moveRecord.recordMove(kingSideCastling), "0-0");
    expect(moveRecord.recordMove(queenSideCastling), "0-0-0");
});