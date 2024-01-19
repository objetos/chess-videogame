//******  CLASS PROLOG, ASSERT FLOATING INPUTS, DOCUMENT CONSTRUCTOR, REMOVE MAGIC NUMBERS
class Board {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;
    #piecesDictionary = {};
    #piecesMatrix = [];
    #pieces = [];

    /**
     * Gives a bitboard with a single file.
     * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
     * @returns {BigInt} Bitboard that contains the specified file.
     */
    static GetFile(fileNumber) {
        console.assert(typeof fileNumber === "number", "File is of incorrect type");
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
        console.assert(typeof rankNumber === "number", "Rank is of incorrect type");
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
        console.assert(typeof inputDiagonalNumber === "number", "Diagonal is of incorrect type");
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
            diagonalBitboard = this.FlipDiagonally(diagonalBitboard);
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
        console.assert(typeof inputAntiDiagonalNumber === "number", "AntiDiagonal is of incorrect type");
        console.assert(inputAntiDiagonalNumber >= 1 && inputAntiDiagonalNumber <= 15, "AntiDiagonal " + inputAntiDiagonalNumber + " is out of bounds.");

        // Get a normal diagonal
        let diagonalBitboard = this.GetDiagonal(inputAntiDiagonalNumber);
        // Mirror the diagonal horizontally to get an antiDiagonal.
        let antiDiagonalBitboard = this.MirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }

    /**
     * Flips a bitboard along the 8th diagonal (middle diagonal).
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard 
     * @returns {BigInt} Flipped bitboard
     */
    static FlipDiagonally(bitboard) {
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
    static FlipAntiDiagonally(bitboard) {
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
    static MirrorHorizontally(bitboard) {
        console.assert(typeof bitboard === "bigint", "Incorrect type");

        let k1 = 0x5555555555555555n;
        let k2 = 0x3333333333333333n;
        let k4 = 0x0f0f0f0f0f0f0f0fn;

        bitboard = ((bitboard >> 1n) & k1) | ((bitboard & k1) << 1n);
        bitboard = ((bitboard >> 2n) & k2) | ((bitboard & k2) << 2n);
        bitboard = ((bitboard >> 4n) & k4) | ((bitboard & k4) << 4n);

        return bitboard;
    }

    constructor(inputFen) {
        let chessBoard = new Quadrille(inputFen);

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
                let pieceSymbol = chessBoard.read(rankIndex, fileIndex);
                if (pieceSymbol === null) continue;
                let piece = Quadrille.chessKeys[pieceSymbol];

                //create a piece
                let rank = 8 - rankIndex;
                let file = fileIndex + 1;
                let pieceObject = this.#CreatePiece(piece, rank, file);

                //categorize it by color and type
                this.#piecesDictionary[pieceObject.color][pieceObject.GetType()].push(pieceObject);

                //add it to pieces array
                this.#pieces.push(pieceObject);
            }
        }
        this.#piecesMatrix = chessBoard;
    }

    /**
     * 
     * @param {Board} board 
     * @returns {Move[]} Array of legal moves
     */
    GetLegalMoves() {
        //secrets: how are moves calculated, transformation from bitboard to moves
        //input:board with pieces
        //output:array of moves with start and end position
        //test: visual test with individual pieces, premade arrays of moves, 
        //errors: null board --> crash,

        let legalMoves = new Array();

        this.#pieces.forEach(piece => {
            //get board with permitted moves
            let pieceMoves = piece.GetMoves(this);
            let testBit = 1n;
            //for each square
            for (let index = 0; index < 64; index++) {
                //if square is permitted
                let squarePermitted = (pieceMoves & testBit) > 0n;
                if (squarePermitted) {
                    //create move from piece position to square
                    let endRank = Math.floor((index) / 8) + 1;
                    let endFile = 8 - (index % 8);
                    let newMove = new Move(piece.rank, piece.file, endRank, endFile);
                    //add move to array
                    legalMoves.push(newMove);
                }
                //continue to next square
                testBit = testBit << 1n;
            }
        });

        return legalMoves;
    }


    /** 
     * @param {E_PieceType} pieceType 
     * @returns {BigInt} Bitboard that contains pieces of given type.
     */
    GetPiecesOfType(pieceType) {

        console.assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");

        //create a empty board
        let pieceTypeBitboard = 0n;

        //find all pieces of given type
        let piecesOfType = new Array();
        for (let pieceColor of Object.values(E_PieceColor)) {
            piecesOfType = piecesOfType.concat(this.#piecesDictionary[pieceColor][pieceType]);
        }

        //for each piece of given type    
        for (let piece of piecesOfType) {
            //get location in board
            let position = piece.position;
            //add it to board
            pieceTypeBitboard = pieceTypeBitboard | position;
        }

        return pieceTypeBitboard;
    }

    /**
     * @param {E_PieceColor} pieceColor 
     * @returns Bitboard that contains pieces of given color.
     */
    GetPiecesOfColor(pieceColor) {

        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        //create a empty board
        let pieceColorBitboard = 0n;

        //find all pieces of given color
        let piecesOfColor = new Array();
        for (let pieceType of Object.values(E_PieceType)) {
            piecesOfColor = piecesOfColor.concat(this.#piecesDictionary[pieceColor][pieceType]);
        }

        //for each piece of given color    
        for (let piece of piecesOfColor) {
            //get location in board
            let position = piece.position;
            //add it to board
            pieceColorBitboard = pieceColorBitboard | position;
        }

        return pieceColorBitboard;
    }

    /**
     * @returns Bitboard that contains all spaces occupied by a piece.
     */
    GetOccupied() {
        //get board occupied by white pieces
        let whitePieces = this.GetPiecesOfColor(E_PieceColor.White);
        //get board occupied by black pieces
        let blackPieces = this.GetPiecesOfColor(E_PieceColor.Black);
        //join white board and black board
        let occupied = whitePieces | blackPieces;
        return occupied;
    }


    /**
     * @returns Bitboard that contains all spaces not occupied by a piece.
     */
    GetEmptySpaces() {
        //test: square by square check
        //get board occupied by pieces
        let occupied = this.GetOccupied();
        //reverse board to obtain empty spaces
        let empty = ~occupied;

        return empty;
    }

    /**
     * 
     * @returns FEN representation of board 
     */

    GetFen() {
        return this.#piecesMatrix.toFEN();
    }

    /**
     * 
     * @param {Move} move Applies move to board
     */
    ApplyMove(move) {


    }

    /**
     * Prints 8x8 chess board in the console showing pieces' position and type. 
     * Lowercase letters are for black pieces. Uppercase letters are for white pieces.
     * W = White. B = Black. P = Pawn. R = Rook. N = Knight. B = Bishop. Q = Queen. K = King. # = Empty.
     */
    Print() {
        let string = "";
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {

                let piece = this.#piecesMatrix.read(rankIndex, fileIndex);

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
                break;
        }
        return pieceObject;
    }
}