//******  CLASS PROLOG, ASSERT FLOATING INPUTS,  REMOVE MAGIC NUMBERS
class BoardImplementation {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;
    #piecesDictionary = {}; //pieces categorized by color and type.
    #board = new Quadrille(8, 8);//board with piece objects.

    /**
     * Gives a bitboard with a single file.
     * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
     * @returns {BigInt} Bitboard that contains the specified file.
     */
    static GetFile(fileNumber) {
        console.assert(typeof fileNumber === "number", "File Invalid");
        console.assert(fileNumber >= 1 && fileNumber <= 8, "File " + fileNumber + " is out of bounds.");

        let fileBitboard = this.#FIRST_FILE;
        //Move first file n positions
        fileBitboard = fileBitboard << BigInt(8 - fileNumber);
        return fileBitboard;
    }

    /**
     * Gives a bitboard with a single file.
     * @param {number} rankNumber Number of the rank, going from 1 to 8, where 1 is the bottom row of the board.
     * @returns {BigInt} Bitboard that contains the specified rank.
     */
    static GetRank(rankNumber) {
        console.assert(typeof rankNumber === "number", "Rank Invalid");
        console.assert(rankNumber >= 1 && rankNumber <= 8, "Rank " + rankNumber + " is out of bounds.");

        let rankBitboard = this.#FIRST_RANK;
        //Move first rank n positions
        rankBitboard = rankBitboard << BigInt((rankNumber - 1) * 8);
        return rankBitboard;
    }

    /**
     * Gives a bitboard with a single diagonal.
     * @param {number} inputDiagonalNumber Number of the diagonal, going from 1 to 15, where 1 is the bottom right diagonal 
     * and 15 the top left diagonal of the board.
     * @returns {BigInt} Bitboard that contains the specified diagonal.
     */
    static GetDiagonal(inputDiagonalNumber) {
        console.assert(typeof inputDiagonalNumber === "number", "Diagonal Invalid");
        console.assert(inputDiagonalNumber >= 1 && inputDiagonalNumber <= 15, "Diagonal " + inputDiagonalNumber + " is out of bounds.");

        // Calculate for up to the eight diagonal
        let diagonalNumber = inputDiagonalNumber;
        if (8 < diagonalNumber) {
            diagonalNumber = 8 - (diagonalNumber % 8);
        }

        //Build the diagonal procedurally
        let diagonalBitboard = 1n;
        for (let i = 1; i < diagonalNumber; i++) {
            diagonalBitboard = (diagonalBitboard << 1n) | (1n << BigInt(8 * i))
        }

        // Flip diagonally for diagonals greater than the eight one.
        if (8 < inputDiagonalNumber) {
            diagonalBitboard = this.#FlipDiagonally(diagonalBitboard);
        }

        return diagonalBitboard;
    }

    /**
     * Gives a bitboard with a single antidiagonal.
     * @param {number} inputAntiDiagonalNumber Number of the antidiagonal, going from 1 to 15, where 1 is the bottom left antidiagonal 
     * and 15 the top right antidiagonal of the board.
     * @returns {BigInt} Bitboard that contains the specified antidiagonal.
     */
    static GetAntiDiagonal(inputAntiDiagonalNumber) {
        console.assert(typeof inputAntiDiagonalNumber === "number", "AntiDiagonal Invalid");
        console.assert(inputAntiDiagonalNumber >= 1 && inputAntiDiagonalNumber <= 15, "AntiDiagonal " + inputAntiDiagonalNumber + " is out of bounds.");

        // Get a normal diagonal
        let diagonalBitboard = this.GetDiagonal(inputAntiDiagonalNumber);
        // Mirror the diagonal horizontally to get an antiDiagonal.
        let antiDiagonalBitboard = this.#MirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }

    /**
     * Flips a bitboard along the 8th diagonal (middle diagonal).
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard 
     * @returns {BigInt} Flipped bitboard
     */
    static #FlipDiagonally(bitboard) {
        console.assert(typeof bitboard === "bigint", "Incorrect type");

        let k4 = 0xf0f0f0f00f0f0f0fn;
        let k2 = 0xcccc0000cccc0000n;
        let k1 = 0xaa00aa00aa00aa00n;
        let t;

        t = bitboard ^ (bitboard << 36n);
        bitboard ^= k4 & (t ^ (bitboard >> 36n));
        t = k2 & (bitboard ^ (bitboard << 18n));
        bitboard ^= t ^ (t >> 18n);
        t = k1 & (bitboard ^ (bitboard << 9n));
        bitboard ^= t ^ (t >> 9n);

        return bitboard;
    }

    /**
     * Flips a bitboard along the 8th antidiagonal (middle antidiagonal).
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard 
     * @returns {BigInt} Flipped bitboard
     */
    static #FlipAntiDiagonally(bitboard) {
        console.assert(typeof bitboard === "bigint", "Incorrect type");

        let k4 = 0x0f0f0f0f00000000n;
        let k2 = 0x3333000033330000n;
        let k1 = 0x5500550055005500n;
        let t;

        t = k4 & (bitboard ^ (bitboard << 28n));
        bitboard ^= t ^ (t >> 28n);
        t = k2 & (bitboard ^ (bitboard << 14n));
        bitboard ^= t ^ (t >> 14n);
        t = k1 & (bitboard ^ (bitboard << 7n));
        bitboard ^= t ^ (t >> 7n);

        return bitboard;
    }

    /**
     * Mirrors a bitboard along a vertical line.
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard 
     * @returns {BigInt} Mirrored bitboard 
     */
    static #MirrorHorizontally(bitboard) {
        console.assert(typeof bitboard === "bigint", "Incorrect type");

        let k1 = 0x5555555555555555n;
        let k2 = 0x3333333333333333n;
        let k4 = 0x0f0f0f0f0f0f0f0fn;

        bitboard = ((bitboard >> 1n) & k1) | ((bitboard & k1) << 1n);
        bitboard = ((bitboard >> 2n) & k2) | ((bitboard & k2) << 2n);
        bitboard = ((bitboard >> 4n) & k4) | ((bitboard & k4) << 4n);

        return bitboard;
    }

    /**
     * Creates a new chess board
     * @param {string} inputFen FEN of board
     */
    constructor(inputFen) {
        console.assert(typeof inputFen === 'string', "Invalid FEN");

        let inputBoard = new Quadrille(inputFen);

        //initialize dictionary of pieces
        this.#piecesDictionary = {};
        for (let color of Object.values(E_PieceColor)) {
            this.#piecesDictionary[color] = {}
            for (let type of Object.values(E_PieceType)) {
                this.#piecesDictionary[color][type] = new Array();
            }
        }

        //for each square
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {

                //if there's a piece
                let pieceSymbol = inputBoard.read(rankIndex, fileIndex);
                if (pieceSymbol === null) continue;
                let piece = Quadrille.chessKeys[pieceSymbol];

                //create a piece
                let rank = 8 - rankIndex;
                let file = fileIndex + 1;
                let pieceObject = this.#CreatePiece(piece, rank, file);

                //categorize piece by color and type
                this.#piecesDictionary[pieceObject.color][pieceObject.GetType()].push(pieceObject);

                //add piece object to board
                this.#board.fill(rankIndex, fileIndex, pieceObject);
            }
        }
    }


    /**
     *
     * @param {E_PieceColor} pieceColor 
     * @param {E_PieceType} pieceType 
     * @returns {BigInt} Bitboard that contains pieces of given characteristics.
     */
    GetSpacesWithPieces(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
        console.assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        let piecesBitboard = 0n;
        let pieces = [];

        if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) return this.GetOccupiedSpaces();

        if (pieceColor === E_PieceColor.Any) {
            for (let color of Object.values(E_PieceColor)) {
                pieces = pieces.concat(this.#piecesDictionary[color][pieceType]);
            }
        } else if (pieceType === E_PieceType.Any) {
            for (let type of Object.values(E_PieceType)) {
                pieces = pieces.concat(this.#piecesDictionary[pieceColor][type]);
            }
        } else {
            pieces = pieces.concat(this.#piecesDictionary[pieceColor][pieceType]);
        }

        //for each piece of given type    
        for (let piece of pieces) {
            //get location in board
            let position = piece.position;
            //add it to board
            piecesBitboard = piecesBitboard | position;
        }

        return piecesBitboard;
    }

    /**
     * @returns Bitboard that contains all spaces occupied by a piece.
     */
    GetOccupiedSpaces() {
        return this.#board.toBigInt();
    }

    /**
     * @returns Bitboard that contains all spaces not occupied by a piece.
     */
    GetEmptySpaces() {
        //get board occupied by pieces
        let occupied = this.GetOccupiedSpaces();
        //reverse board to obtain empty spaces
        let empty = ~occupied;
        return empty;
    }


    /**
     * Applies move to board
     * @param {Move} move 
     */
    MakeMove(move) {
        //secrets: how are moves are done, information changed internally
        //preconditions: move is legal and within board range
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

        //move piece in boards
        this.#board.clear(startRankIndex, startFileIndex);
        this.#board.fill(endRankIndex, endFileIndex, pieceToMove);

        let pieceSymbol = this.#board.read(startRankIndex, startFileIndex);
        this.#board.clear(startRankIndex, startFileIndex);
        this.#board.fill(endRankIndex, endFileIndex, pieceSymbol);
        //update piece info
        pieceToMove.SetPosition(move.endRank, move.endFile);
        //change playing color
    }

    UnmakeMove(move) {
        let reverseMove = new Move(move.endRank, move.endFile, move.startRank, move.startFile);
        this.MakeMove(reverseMove);
    }

    GetPieces() {
        return this.#piecesDictionary;
    }

    #CreatePiece(piece, rank, file) {
        let pieceObject = null;
        switch (piece) {
            case 'K':
                pieceObject = new King(E_PieceColor.White, rank, file);
                break;
            case 'Q':
                pieceObject = new Queen(E_PieceColor.White, rank, file);
                break;
            case 'B':
                pieceObject = new Bishop(E_PieceColor.White, rank, file);
                break;
            case 'R':
                pieceObject = new Rook(E_PieceColor.White, rank, file);
                break;
            case 'N':
                pieceObject = new Knight(E_PieceColor.White, rank, file);
                break;
            case 'P':
                pieceObject = new Pawn(E_PieceColor.White, rank, file);
                break;
            case 'k':
                pieceObject = new King(E_PieceColor.Black, rank, file);
                break;
            case 'q':
                pieceObject = new Queen(E_PieceColor.Black, rank, file);
                break;
            case 'b':
                pieceObject = new Bishop(E_PieceColor.Black, rank, file);
                break;
            case 'r':
                pieceObject = new Rook(E_PieceColor.Black, rank, file);
                break;
            case 'n':
                pieceObject = new Knight(E_PieceColor.Black, rank, file);
                break;
            case 'p':
                pieceObject = new Pawn(E_PieceColor.Black, rank, file);
                break;
            default:
                throw new Error("Incorrect piece type:" + piece);
        }
        return pieceObject;
    }

}