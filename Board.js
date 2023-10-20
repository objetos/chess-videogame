//******  CLASS PROLOG, ASSERT FLOATING INPUTS
class Board {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;
    #piecesDictionary = {};
    #piecesMatrix = [];

    static GetFile(inputFileNumber) {
        console.assert(typeof inputFileNumber === "number", "File is of incorrect type");
        console.assert(inputFileNumber >= 1 && inputFileNumber <= 8, "File " + inputFileNumber + " is out of bounds.");

        let fileBitboard = this.#FIRST_FILE;
        //Move first file n positions
        fileBitboard = fileBitboard << BigInt(8 - inputFileNumber);
        return fileBitboard;
    }

    static GetRank(inputRankNumber) {
        console.assert(typeof inputRankNumber === "number", "Rank is of incorrect type");
        console.assert(inputRankNumber >= 1 && inputRankNumber <= 8, "Rank " + inputRankNumber + " is out of bounds.");

        let rankBitboard = this.#FIRST_RANK;
        //Move first rank n positions
        rankBitboard = rankBitboard << BigInt((inputRankNumber - 1) * 8);
        return rankBitboard;
    }

    static GetDiagonal(inputDiagonalNumber) {
        console.assert(typeof inputDiagonalNumber === "number", "Diagonal is of incorrect type");
        console.assert(inputDiagonalNumber >= 1 && inputDiagonalNumber <= 15, "Diagonal " + inputDiagonalNumber + " is out of bounds.");

        // Calculate for up to the eight diagonal
        let diagonalNumber = inputDiagonalNumber;
        if (8 < inputDiagonalNumber) {
            diagonalNumber = 8 - (inputDiagonalNumber % 8);
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

    static GetAntiDiagonal(inputAntiDiagonalNumber) {
        console.assert(typeof inputAntiDiagonalNumber === "number", "AntiDiagonal is of incorrect type");
        console.assert(inputAntiDiagonalNumber >= 1 && inputAntiDiagonalNumber <= 15, "AntiDiagonal " + inputAntiDiagonalNumber + " is out of bounds.");

        // Get a normal diagonal
        let diagonalBitboard = this.GetDiagonal(inputAntiDiagonalNumber);
        // Mirror the diagonal horizontally to get an antiDiagonal.
        let antiDiagonalBitboard = this.MirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }

    //(REF)Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
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

    //(REF)Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
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

    //(REF)Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
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

    constructor(inputPieceMatrix) {
        this.#CreatePieces(inputPieceMatrix);
    }

    GetPiecesOfType(pieceType) {

        console.assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");

        //create a empty board
        let pieceTypeBitboard = 0n;

        //find all pieces of given type
        let piecesOfType = new Array();
        for (let pieceColor of Object.values(E_PieceColor)) {
            piecesOfType = piecesOfType.concat(this.#piecesDictionary[pieceColor][pieceType])
        }

        //for each piece of given type    
        for (let piece of piecesOfType) {
            //get location in board
            let position = piece.GetPosition();
            //add it to board
            pieceTypeBitboard = pieceTypeBitboard | position;
        }

        return pieceTypeBitboard;
    }

    GetPiecesOfColor(pieceColor) {

        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        //create a empty board
        let pieceColorBitboard = 0n;

        //find all pieces of given color
        let piecesOfColor = new Array();
        for (let pieceType of Object.values(E_PieceType)) {
            piecesOfColor = piecesOfColor.concat(this.#piecesDictionary[pieceColor][pieceType])
        }

        //for each piece of given color    
        for (let piece of piecesOfColor) {
            //get location in board
            let position = piece.GetPosition();
            //add it to board
            pieceColorBitboard = pieceColorBitboard | position;
        }

        return pieceColorBitboard;
    }

    GetOccupied() {
        //test: square by square check

        //get board occupied by white pieces
        let whitePieces = this.GetPiecesOfColor(E_PieceColor.White);
        //get board occupied by black pieces
        let blackPieces = this.GetPiecesOfColor(E_PieceColor.Black);
        //join white board and black board
        let occupied = whitePieces | blackPieces;
        return occupied;
    }

    GetEmptySpaces() {
        //test: square by square check
        //get board occupied by pieces
        let occupied = this.GetOccupied();
        //reverse board to obtain empty spaces
        let empty = ~occupied;

        return empty;
    }


    ApplyMove(move) {


    }

    Print() {
        let string = "";
        for (let rankIndex = 0; rankIndex < this.#piecesMatrix.length; rankIndex++) {
            for (let fileIndex = 0; fileIndex < this.#piecesMatrix[rankIndex].length; fileIndex++) {

                let piece = this.#piecesMatrix[rankIndex][fileIndex];

                if (piece === undefined) {
                    string += " 00";
                } else {
                    string += " " + piece.ToString();
                }

                if (((fileIndex + 1) % 8) === 0) {
                    string += "\n";
                }
            }
        }
        console.log(string);
    }

    #CreatePieces(inputPieceMatrix) {
        console.assert(Array.isArray(inputPieceMatrix), "Input is not a matrix");
        console.assert(inputPieceMatrix.length == 8, "Input matrix is not 8x8");

        //initialize dictionary of pieces
        this.#piecesDictionary = {};
        for (let color of Object.values(E_PieceColor)) {
            this.#piecesDictionary[color] = {}
            for (let type of Object.values(E_PieceType)) {
                this.#piecesDictionary[color][type] = new Array();
            }
        }

        //initialize board
        this.#piecesMatrix = [];
        for (let i = 0; i < 8; i++) {
            this.#piecesMatrix.push(new Array(8));
        }

        //for each square
        for (let rankIndex = 0; rankIndex < inputPieceMatrix.length; rankIndex++) {
            console.assert(Array.isArray(inputPieceMatrix[rankIndex]), "Input is not a matrix");
            console.assert(inputPieceMatrix[rankIndex], "Input matrix is not 8x8");

            for (let fileIndex = 0; fileIndex < inputPieceMatrix[rankIndex].length; fileIndex++) {

                //if there's a piece
                let piece = inputPieceMatrix[rankIndex][fileIndex];
                if (piece === undefined) continue;

                console.assert(!(piece.type === undefined), "Piece has no type property");
                console.assert(!(piece.color === undefined), "Piece has no color property");

                //create a piece
                let rank = 8 - rankIndex;
                let file = fileIndex + 1;
                let pieceObject = this.#CreatePiece(piece, rank, file);

                //categorize it by color and type
                this.#piecesDictionary[piece.color][piece.type].push(pieceObject);

                //add it to the board
                this.#piecesMatrix[rankIndex][fileIndex] = pieceObject;
            }
        }
    }

    #CreatePiece(piece, rank, file) {
        let pieceObject = null;
        switch (piece.type) {
            case E_PieceType.King:
                pieceObject = new King(piece.color, rank, file);
                break;
            case E_PieceType.Queen:
                pieceObject = new Queen(piece.color, rank, file);
                break;
            case E_PieceType.Bishop:
                pieceObject = new Bishop(piece.color, rank, file);
                break;
            case E_PieceType.Rook:
                pieceObject = new Rook(piece.color, rank, file);
                break;
            case E_PieceType.Knight:
                pieceObject = new Knight(piece.color, rank, file);
                break;
            case E_PieceType.Pawn:
                pieceObject = new Pawn(piece.color, rank, file);
                break;
            case E_PieceType.None:
                console.error("No type set to piece");
                break;
            default:
                console.error("Incorrect piece type:" + piece.type);
                break;
        }
        return pieceObject;
    }
}