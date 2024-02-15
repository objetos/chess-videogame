//******  Class prolog
class Board {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;

    static CASTLING_FILES = {//****** move to a global context, change array for smth else
        [E_MoveFlag.QueenSideCastling]: {
            [E_PieceType.King]: [5, 3],
            [E_PieceType.Rook]: [1, 4]
        },
        [E_MoveFlag.KingSideCastling]: {
            [E_PieceType.King]: [5, 7],
            [E_PieceType.Rook]: [8, 6]
        }
    }

    #piecesDictionary = {}; //pieces categorized by color and type.
    #board = new Quadrille(8, 8);//board with piece objects.
    #moveGenerator;

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

        this.#moveGenerator = new MoveGenerator();
        let inputBoard = new Quadrille(inputFen);

        //initialize dictionary of pieces
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
                //add piece
                this.#AddPiece(pieceObject, rank, file);
            }
        }

        /*
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
        */
    }

    /**
     * @param {E_PieceColor} color
     * @return {Move[]} Array of legal moves of pieces of given color 
     */
    GenerateMoves(pieceColor) {
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");
        return this.#moveGenerator.GenerateMoves(this, this.#piecesDictionary, pieceColor);
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
        //errors: move to same spot, move out of bounds, no piece on rank or file, two pieces of same color in same square,

        //check rank and file are within bounds ******
        //check start and destination squares are not the same ****** 
        //assert move

        let pieceToMove = this.#GetPiece(move.startRank, move.startFile);
        //if no piece in start square
        if (pieceToMove === null) {
            console.log(move);
            throw new Error("Failed making move. No piece in start square");
        }
        try {
            switch (move.flag) {
                case E_MoveFlag.Regular:
                    this.#MakeRegularMove(move);
                    break;
                case E_MoveFlag.Promotion:
                    this.#MakePromotionMove(move);
                    break;
                case E_MoveFlag.KingSideCastling:
                    this.#MakeCastlingMove(move);
                    break;
                case E_MoveFlag.QueenSideCastling:
                    this.#MakeCastlingMove(move);
                    break;
                case E_MoveFlag.EnPassant:
                    this.#MakeEnPassantMove(move);
                    break;
                case E_MoveFlag.None:
                    throw new Error("Failed making move. Move has no flag");
                default:
                    throw new Error("Failed making move. Move has no flag");
            }
        } catch (error) {
            console.log(move);
            this.Print();
            throw error;
        }
    }

    UnmakeMove(move) {
        let reverseMove = new Move(move.endRank, move.endFile, move.startRank, move.startFile);
        this.MakeMove(reverseMove);
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

    Draw() {
        drawQuadrille(this.#board, {
            objectDisplay: ({ graphics, value, cellLength = Quadrille.cellLength } = {}) => {
                let piece = value;
                graphics.rect(0, 0, cellLength, cellLength);
                let pieceKey = piece.toString();
                graphics.textAlign(CENTER, CENTER);
                graphics.textSize(cellLength * 0.8);
                graphics.text(Quadrille.chessSymbols[pieceKey], 0, 0, cellLength, cellLength);
            }
        });
    }

    /**
     * Prints 8x8 chess board in the console showing pieces' position and type. 
     * Lowercase letters refer to black pieces. Uppercase letters refer to white pieces.
     * W = White. B = Black. P = Pawn. R = Rook. N = Knight. B = Bishop. Q = Queen. K = King. # = Empty.
     */
    Print() {
        let string = "";

        visitQuadrille(this.#board, (row, col) => {
            let piece = this.#board.read(row, col);

            if (piece === null) {
                string += " #";
            } else {
                string += " " + piece.toString();
            }

            if (((col + 1) % 8) === 0) {
                string += "\n";
            }
        });

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
        }
        return pieceObject;
    }


    #MakeRegularMove(move) {
        //if there's a piece in destination
        if (this.#GetPiece(move.endRank, move.endFile) !== null) {
            //capture it
            this.#RemovePiece(move.endRank, move.endFile);
        }
        //move piece
        let pieceToMove = this.#GetPiece(move.startRank, move.startFile);
        this.#RemovePiece(move.startRank, move.startFile);
        this.#AddPiece(pieceToMove, move.endRank, move.endFile);
        pieceToMove.SetPosition(move.endRank, move.endFile);
    }

    //****** choose promotion from captured pieces
    #MakePromotionMove(move) {
        //remove pawn
        this.#RemovePiece(move.startRank, move.startFile);
        //if promotion occurs on rank 8
        if (move.endRank === 8) {
            //add a white queen
            let whiteQueen = this.#CreatePiece('Q', move.endRank, move.endFile);
            this.#AddPiece(whiteQueen, move.endRank, move.endFile);
        } else if (move.endRank === 1) { //else if it occurs on rank 1
            //add a black queen
            let blackQueen = this.#CreatePiece('q', move.endRank, move.endFile);
            this.#AddPiece(blackQueen, move.endRank, move.endFile);
        } else {
            //error ******
        }
    }

    #MakeCastlingMove(move) {
        let piece = this.#GetPiece(move.startRank, move.startFile);
        //move piece
        this.#MakeRegularMove(move);
        //if king moved
        if (piece.GetType() === E_PieceType.King) {
            //move rook
            let rookMove = new Move(
                move.startRank,
                Board.CASTLING_FILES[move.flag][E_PieceType.Rook][0],
                move.startRank,
                Board.CASTLING_FILES[move.flag][E_PieceType.Rook][1],
                E_MoveFlag.Regular
            );
            this.#MakeRegularMove(rookMove);
        } //else if rook moved
        else if (piece.GetType() === E_PieceType.Rook) {
            //move king
            let rookMove = new Move(
                move.startRank,
                Board.CASTLING_FILES[move.flag][E_PieceType.King][0],
                move.startRank,
                Board.CASTLING_FILES[move.flag][E_PieceType.King][1],
                E_MoveFlag.Regular
            );
            this.#MakeRegularMove(rookMove);
        } else {
            //error ******
        }
    }

    #MakeEnPassantMove(move) {
        //move pawn
        this.#MakeRegularMove(move);
        //remove captured pawn
        this.#RemovePiece(move.startRank, move.endFile);
    }

    #AddPiece(piece, rank, file) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        if (this.#GetPiece(rank, file) !== null) {
            throw new Error("Cannot add piece in a occupied square");
        }
        this.#piecesDictionary[piece.color][piece.GetType()].push(piece);
        this.#board.fill(rankIndex, fileIndex, piece);
    }

    #RemovePiece(rank, file) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        let piece = this.#GetPiece(rank, file);

        if (piece === null) {
            throw new Error("No piece to remove in given rank and file")
        }

        let pieceIndex = this.#piecesDictionary[piece.color][piece.GetType()].indexOf(piece);
        if (pieceIndex > -1) {
            this.#piecesDictionary[piece.color][piece.GetType()].splice(pieceIndex, 1);
        } else {
            throw new Error("Piece not found in dictionary");
        }

        this.#board.clear(rankIndex, fileIndex);
    }

    #GetPiece(rank, file) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        return this.#board.read(rankIndex, fileIndex);
    }
}