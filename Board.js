//****** Document methods
class Board {
    #board;
    #boardImplementation;
    #moveGenerator;

    constructor(inputFen) {
        this.#board = new Quadrille(inputFen);
        this.#boardImplementation = new BoardImplementation(inputFen);
        this.#moveGenerator = new MoveGenerator();
    }

    /**
     * @param {E_PieceColor} color
     * @return {Move[]} Array of legal moves of pieces of given color 
     */
    GenerateMoves(pieceColor) {
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");
        return this.#moveGenerator.GenerateMoves(this.#boardImplementation, pieceColor);
    }

    /**
     * 
     * @param {Move} move Applies move to board
     */
    MakeMove(move) {
        //secrets: how are moves are done, information changed internally
        //preconditions: move is legal and within board range. special moves have a flag to identify them
        //postconditions: info will be updated 
        //input:move
        //output:none
        //test: Print to visualize move is done, input incorrect moves and see response
        //errors: move to same spot, move out of bounds, no piece on rank or file, 
        //two pieces of same color in same square,

        //check rank and file are within bounds ******
        //check start and destination squares are not the same ****** 
        let startRankIndex = 8 - move.startRank;
        let startFileIndex = move.startFile - 1;
        let endRankIndex = 8 - move.endRank;
        let endFileIndex = move.endFile - 1;

        //get piece in start square
        let pieceToMove = this.#board.read(startRankIndex, startFileIndex);
        //if no piece in square
        if (pieceToMove == null) {
            //error ****** 
            console.log("Failed making move. No piece in start square");
            console.log(move);
        }

        //check piece in destination square
        let pieceInDestination = this.#board.read(endRankIndex, endFileIndex);
        //if there's a piece in destination square
        if (pieceInDestination != null) {
            //if it's of opposite color
            if (pieceInDestination.color != pieceToMove.color) {
                //capture piece
                pieceInDestination.Capture();
                //remove  piece from board
                this.#board.clear(endRankIndex, endFileIndex);
            } else { //if it's of the same color
                //error
            }
        }

        let pieceSymbol = this.#board.read(startRankIndex, startFileIndex);
        this.#board.clear(startRankIndex, startFileIndex);
        this.#board.fill(endRankIndex, endFileIndex, pieceSymbol);
    }

    UnmakeMove(move) {
        let reverseMove = new Move(move.endRank, move.endFile, move.startRank, move.startFile);
        this.MakeMove(reverseMove);
    }

    /**
 * @returns FEN representation of board 
 */
    GetFEN() {
        return this.#board.toFEN();
    }

    /**
     * Prints 8x8 chess board in the console showing pieces' position and type. 
     * Lowercase letters refer to black pieces. Uppercase letters refer to white pieces.
     * W = White. B = Black. P = Pawn. R = Rook. N = Knight. B = Bishop. Q = Queen. K = King. # = Empty.
     */
    Print() {
        let string = "";
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {

                let piece = this.#board.read(rankIndex, fileIndex);

                if (piece === null) {
                    string += " #";
                } else {
                    string += " " + Quadrille.chessKeys[piece];
                }

                if (((fileIndex + 1) % 8) === 0) {
                    string += "\n";
                }
            }
        }
        console.log(string);
    }
}