//******  CLASS PROLOG, ASSERT FLOATING INPUTS IN GETTING RANK FILE, ASSERT NEW METHODS,  REMOVE MAGIC NUMBERS, DOCUMENT NEW METHODS, TESTING NEW METHODS
class Board {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;

    #piecesDictionary = {}; //pieces categorized by color and type.
    #board = new Quadrille(8, 8);//board with piece objects.
    #moveGenerator;
    #boardChanges = [];
    #castlingRigths = {
        [E_PieceColor.White]: {
            [E_MoveFlag.KingSideCastling]: false,
            [E_MoveFlag.QueenSideCastling]: false
        }, [E_PieceColor.Black]: {
            [E_MoveFlag.KingSideCastling]: false,
            [E_MoveFlag.QueenSideCastling]: false
        }
    }
    #lastPawnJump = null;

    /**
     * Gives a bitboard with a single file.
     * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
     * @returns {BigInt} Bitboard that contains the specified file.
     */
    static getFile(fileNumber) {
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
    static getRank(rankNumber) {
        console.assert(typeof rankNumber === "number", "Rank Invalid");
        console.assert(rankNumber >= 1 && rankNumber <= 8, "Rank " + rankNumber + " is out of bounds.");

        let rankBitboard = this.#FIRST_RANK;
        //Move first rank n positions
        rankBitboard = rankBitboard << BigInt((rankNumber - 1) * 8);
        return rankBitboard;
    }

    /**
     * Gives a bitboard with a single diagonal that contains the square given by rank and file.
     * @param {number} rank 
     * @param {number} file 
     * @returns {BigInt} Bitboard that contains the diagonal.
     */
    static getDiagonal(rank, file) {

        console.assert(typeof rank === "number", "Rank Invalid");
        console.assert(rank >= 1 && rank <= 8, "Rank " + rank + " is out of bounds.");
        console.assert(typeof file === "number", "File Invalid");
        console.assert(file >= 1 && file <= 8, "File " + file + " is out of bounds.");

        let diagonalNumber = (9 - file) + rank - 1;
        // Calculate for up to the eight diagonal
        let clampedDiagonalNumber = diagonalNumber;
        if (8 < diagonalNumber) {
            clampedDiagonalNumber = 8 - (diagonalNumber % 8);
        }

        //Build the diagonal procedurally
        let diagonalBitboard = 1n;
        for (let i = 1; i < clampedDiagonalNumber; i++) {
            diagonalBitboard = (diagonalBitboard << 1n) | (1n << BigInt(8 * i))
        }

        // Flip diagonally for diagonals greater than the eight one.
        if (8 < diagonalNumber) {
            diagonalBitboard = this.#flipDiagonally(diagonalBitboard);
        }

        return diagonalBitboard;
    }

    /**
     * Gives a bitboard with a single antidiagonal that contains the square given by rank and file.
     * @param {number} rank 
     * @param {number} file
     * @returns {BigInt} Bitboard that contains the antidiagonal.
     */
    static getAntiDiagonal(rank, file) {

        console.assert(typeof rank === "number", "Rank Invalid");
        console.assert(rank >= 1 && rank <= 8, "Rank " + rank + " is out of bounds.");
        console.assert(typeof file === "number", "File Invalid");
        console.assert(file >= 1 && file <= 8, "File " + file + " is out of bounds.");

        // Get a normal diagonal
        let diagonalBitboard = this.getDiagonal(rank, 9 - file);
        // Mirror the diagonal horizontally to get an antiDiagonal.
        let antiDiagonalBitboard = this.#mirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }

    /**
     * Flips a bitboard along the 8th diagonal (middle diagonal).
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard 
     * @returns {BigInt} Flipped bitboard
     */
    static #flipDiagonally(bitboard) {
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
    static #flipAntiDiagonally(bitboard) {
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
    static #mirrorHorizontally(bitboard) {
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
                let pieceObject = this.#createPiece(piece, rank, file);
                //add piece
                this.addPiece(pieceObject, rank, file, false);
            }
        }

        //calculate castling rights
        for (let color of Object.values(E_PieceColor)) {
            if (color === E_PieceColor.None || color === E_PieceColor.Any) continue;

            let king = this.#getPieces(color, E_PieceType.King).pop();
            if (king === undefined) {
                this.#setCastlingRights(color, E_MoveFlag.KingSideCastling, false);
                this.#setCastlingRights(color, E_MoveFlag.QueenSideCastling, false);
                continue;
            } else {
                let isKingInInitialSquare = king.color === E_PieceColor.White ?
                    (king.rank === 1 && king.file === 5) :
                    (king.rank === 8 && king.file === 5);
                if (!isKingInInitialSquare) {
                    this.#setCastlingRights(color, E_MoveFlag.KingSideCastling, false);
                    this.#setCastlingRights(color, E_MoveFlag.QueenSideCastling, false);
                    continue;
                }
            }

            let rooks = this.#getPieces(color, E_PieceType.Rook);
            for (let rook of rooks) {
                let isRookInInitialSquare = rook.color === E_PieceColor.White ?
                    (rook.rank === 1 && rook.file === 1) | (rook.rank === 1 && rook.file === 8) :
                    (rook.rank === 8 && rook.file === 1) | (rook.rank === 8 && rook.file === 8);

                if (!isRookInInitialSquare) continue;

                let castlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;

                this.#castlingRigths[rook.color][castlingSide] = true;
            }
        }


    }

    /**
     * @param {E_PieceColor} color
     * @return {Move[]} Array of legal moves of pieces of given color 
     */
    generateMoves(pieceColor) {
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");
        return this.#moveGenerator.generateMoves(this, this.#piecesDictionary, pieceColor);
    }

    /**
     * 
     * @param {Move} move Applies move to board
     */
    makeMove(move) {
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

        let pieceToMove = this.#getPiece(move.startRank, move.startFile);
        //if no piece in start square
        if (pieceToMove === null) {
            console.log(move);
            throw new Error("Failed making move. No piece in start square");
        }
        try {
            this.#boardChanges.push([]);
            this.#updateCastlingRights(move);//****** assert or any move flag
            this.#updateLastPawnJump(move);
            switch (move.flag) {
                case E_MoveFlag.Regular:
                    this.#makeRegularMove(move);
                    break;
                case E_MoveFlag.Promotion:
                    this.#makePromotionMove(move);
                    break;
                case E_MoveFlag.KingSideCastling:
                    this.#makeCastlingMove(move);
                    break;
                case E_MoveFlag.QueenSideCastling:
                    this.#makeCastlingMove(move);
                    break;
                case E_MoveFlag.EnPassant:
                    this.#makeEnPassantMove(move);
                    break;
                case E_MoveFlag.None:
                    throw new Error("Failed making move. Move has no flag");
                default:
                    throw new Error("Failed making move. Move has no flag");
            }
        } catch (error) {
            console.log(move);
            this.print();
            this.#boardChanges.pop();
            throw error;
        }
    }

    unmakeMove() {
        //secrets: how are moves are unmade, information changed internally
        //preconditions: a move was made (move history is not empty). 
        //postconditions: board will be updated to last state.
        //input:move
        //output:none
        //test: Visual test. 
        //errors: move to same spot, move out of bounds, no piece on rank or file, two pieces of same color in same square,

        //pop changes from stack 
        let lastChanges = this.#boardChanges.pop();
        let numberOfChanges = lastChanges.length;
        for (let i = 0; i < numberOfChanges; i++) {
            let change = lastChanges.pop();
            //if change was an addition
            if (change.type == "a") {
                //remove piece
                this.removePiece(change.rank, change.file, false);
            } else if (change.type == "r") { //else if change was a removal 
                //add piece
                this.addPiece(change.piece, change.rank, change.file, false);
                change.piece.SetPositionPerft(change.rank, change.file);
            } else if (change.type == "c") {
                this.#setCastlingRights(change.color, change.side, true);
            } else if (change.type == "e") {
                this.#lastPawnJump = change.state === true ? null : change.jump;
            }
        }
    }

    /**
     *
     * @param {E_PieceColor} pieceColor 
     * @param {E_PieceType} pieceType 
     * @returns {BigInt} Bitboard that contains pieces of given characteristics.
     */
    getOccupied(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) { //****** compress in get occupied routine
        console.assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        let piecesBitboard = 0n;
        let pieces = [];

        if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) return this.#board.toBigInt();

        pieces = this.#getPieces(pieceColor, pieceType);

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
     * @returns Bitboard that contains all spaces not occupied by a piece.
     */
    getEmptySpaces() {
        //get board occupied by pieces
        let occupied = this.getOccupied();
        //reverse board to obtain empty spaces
        let empty = ~occupied;
        return empty;
    }

    draw() {
        //background(255);
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

    getAttackedSquares(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {// ****** assert, document
        console.assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");
        console.assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        let pieces = this.#getPieces(pieceColor, pieceType);
        let attacksBitboard = 0n;
        //for every piece of given characteristics
        pieces.forEach(piece => {
            let pieceAttackMoves;
            if (piece.GetType() === E_PieceType.Pawn) {
                pieceAttackMoves = piece.GetCapturingSquares();
            } else {
                pieceAttackMoves = piece.GetMoves(this);
            }
            attacksBitboard |= pieceAttackMoves;
        });

        return attacksBitboard;
    }

    isKingInCheck(kingColor) {// ****** assert, document
        let king = this.#getPieces(kingColor, E_PieceType.King)[0];
        let squaresAttackedByEnemy = this.getAttackedSquares(OppositePieceColor(kingColor));
        return (king.position & squaresAttackedByEnemy) > 0n;
    }

    /**
     * Prints 8x8 chess board in the console showing pieces' position and type. 
     * Lowercase letters refer to black pieces. Uppercase letters refer to white pieces.
     * W = White. B = Black. P = Pawn. R = Rook. N = Knight. B = Bishop. Q = Queen. K = King. # = Empty.
     */
    print() {
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

    #createPiece(piece, rank, file) {
        let pieceObject = null;
        switch (piece) {
            case 'K':
                pieceObject = new King(E_PieceColor.White, rank, file);
                break;
            case 'Q':
                pieceObject = new Queen(E_PieceColor.White, rank, file);
                break;
            case 'B': 8
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


    #makeRegularMove(move) {
        //if there's a piece in destination
        if (this.#getPiece(move.endRank, move.endFile) !== null) {
            //capture it
            this.removePiece(move.endRank, move.endFile);
        }
        //move piece
        let pieceToMove = this.#getPiece(move.startRank, move.startFile);
        this.removePiece(move.startRank, move.startFile);
        this.addPiece(pieceToMove, move.endRank, move.endFile);
        pieceToMove.SetPosition(move.endRank, move.endFile);
    }

    //****** choose promotion from captured pieces, assert
    #makePromotionMove(move) {
        //if there's a piece in destination
        if (this.#getPiece(move.endRank, move.endFile) !== null) {
            //capture it
            this.removePiece(move.endRank, move.endFile);
        }
        //remove pawn
        this.removePiece(move.startRank, move.startFile);
        //create new piece 
        let pieceType = Input.pieceSelectedForPromotion;
        let pieceColor = move.endRank === 8 ? E_PieceColor.White : E_PieceColor.Black;
        let pieceString = pieceColorTypeToString(pieceColor, pieceType);

        let newPiece = this.#createPiece(pieceString, move.endRank, move.endFile);
        this.addPiece(newPiece, move.endRank, move.endFile);

    }

    hasCastlingRights(color, castlingSide) {
        return this.#castlingRigths[color][castlingSide];
    }

    getLastPawnJump() {
        return this.#lastPawnJump;
    }

    #setCastlingRights(color, castlingSide, bool) {
        this.#castlingRigths[color][castlingSide] = bool;
    }

    #updateLastPawnJump(move) {
        let pieceInStart = this.#getPiece(move.startRank, move.startFile);
        if (move.flag === E_MoveFlag.EnPassant) {
            let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
            lastChanges.push({ "type": "e", "state": false, "jump": this.#lastPawnJump });
            this.#lastPawnJump = null;
        } else if (pieceInStart.GetType() === E_PieceType.Pawn) {
            let rankDiff = Math.abs(move.startRank - move.endRank);
            if (rankDiff === 2) {
                this.#lastPawnJump = move;
                let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                lastChanges.push({ "type": "e", "state": true });
            } else if (this.#lastPawnJump !== null) {
                let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                lastChanges.push({ "type": "e", "state": false, "jump": this.#lastPawnJump });
                this.#lastPawnJump = null;
            }
        } else if (this.#lastPawnJump !== null) {
            let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
            lastChanges.push({ "type": "e", "state": false, "jump": this.#lastPawnJump });
            this.#lastPawnJump = null;
        }

    }

    #updateCastlingRights(move) {//****** simplify
        let pieceInStart = this.#getPiece(move.startRank, move.startFile);
        let pieceInDestination = this.#getPiece(move.endRank, move.endFile);

        let isCastlingMove = move.flag === E_MoveFlag.KingSideCastling | move.flag === E_MoveFlag.QueenSideCastling;
        if (isCastlingMove) {
            let castlingSide = move.flag;
            let oppositeCastlingSide = move.flag === E_MoveFlag.KingSideCastling ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
            if (this.hasCastlingRights(pieceInStart.color, castlingSide)) {
                this.#setCastlingRights(pieceInStart.color, castlingSide, false);
                let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                lastChanges.push({ "type": "c", "color": pieceInStart.color, "side": castlingSide });
            }

            if (this.hasCastlingRights(pieceInStart.color, oppositeCastlingSide)) {
                this.#setCastlingRights(pieceInStart.color, oppositeCastlingSide, false);
                let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                lastChanges.push({ "type": "c", "color": pieceInStart.color, "side": oppositeCastlingSide });

            }
            return;
        }

        if (pieceInStart.GetType() === E_PieceType.Rook) {
            let rook = pieceInStart;

            let isRookInInitialSquare = rook.color === E_PieceColor.White ?
                (rook.rank === 1 && rook.file === 1) | (rook.rank === 1 && rook.file === 8) :
                (rook.rank === 8 && rook.file === 1) | (rook.rank === 8 && rook.file === 8);
            if (isRookInInitialSquare) {
                let castlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
                if (this.hasCastlingRights(rook.color, castlingSide)) {
                    this.#setCastlingRights(rook.color, castlingSide, false);
                    let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                    lastChanges.push({ "type": "c", "color": rook.color, "side": castlingSide })
                }
            }

        } else if (pieceInStart.GetType() === E_PieceType.King) {
            let king = pieceInStart;

            let isKingInInitialSquare = king.color === E_PieceColor.White ?
                (king.rank === 1 && king.file === 5) :
                (king.rank === 8 && king.file === 5);//****** transfer

            if (isKingInInitialSquare) {
                if (this.hasCastlingRights(king.color, E_MoveFlag.KingSideCastling)) {
                    this.#setCastlingRights(king.color, E_MoveFlag.KingSideCastling, false);
                    let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                    lastChanges.push({ "type": "c", "color": king.color, "side": E_MoveFlag.KingSideCastling })
                }
                if (this.hasCastlingRights(king.color, E_MoveFlag.QueenSideCastling)) {
                    this.#setCastlingRights(king.color, E_MoveFlag.QueenSideCastling, false);
                    let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                    lastChanges.push({ "type": "c", "color": king.color, "side": E_MoveFlag.QueenSideCastling });
                }
            }
        }

        if (pieceInDestination !== null && pieceInDestination.GetType() === E_PieceType.Rook) {
            let rook = pieceInDestination;
            let isRookInInitialSquare = pieceInDestination.color === E_PieceColor.White ?
                (rook.rank === 1 && rook.file === 1) | (rook.rank === 1 && rook.file === 8) :
                (rook.rank === 8 && rook.file === 1) | (rook.rank === 8 && rook.file === 8);
            if (isRookInInitialSquare) {
                let castlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
                if (this.hasCastlingRights(rook.color, castlingSide)) {
                    this.#setCastlingRights(rook.color, castlingSide, false);
                    let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
                    lastChanges.push({ "type": "c", "color": rook.color, "side": castlingSide })
                }
            }
        }
    }

    #makeCastlingMove(move) {//****** simplify
        let piece = this.#getPiece(move.startRank, move.startFile);
        //move piece
        this.#makeRegularMove(move);
        //if king moved
        if (piece.GetType() === E_PieceType.King) {
            //move rook
            let rookMove = new Move(
                move.startRank,
                CASTLING_FILES[move.flag][E_PieceType.Rook][0],
                move.startRank,
                CASTLING_FILES[move.flag][E_PieceType.Rook][1],
                E_MoveFlag.Regular
            );
            this.#makeRegularMove(rookMove);
        } else {
            //error ******
        }
    }

    #makeEnPassantMove(move) {
        //move pawn
        this.#makeRegularMove(move);
        //remove captured pawn
        this.removePiece(move.startRank, move.endFile);
    }

    addPiece(piece, rank, file, recordChange = true) {//****** piece already has rank and file???? pubilc ?????? 
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        if (this.#getPiece(rank, file) !== null) {
            throw new Error("Cannot add piece in a occupied square");
        }
        this.#piecesDictionary[piece.color][piece.GetType()].push(piece);
        this.#board.fill(rankIndex, fileIndex, piece);

        if (recordChange) {
            let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
            lastChanges.push({ "type": "a", "rank": rank, "file": file, "piece": piece });
        }
    }

    removePiece(rank, file, recordChange = true) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        let piece = this.#getPiece(rank, file);

        if (piece === null) {
            throw new Error("No piece to remove in given rank and file")
        }

        if (recordChange) {
            let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
            lastChanges.push({ "type": "r", "rank": rank, "file": file, "piece": piece });
        }

        let pieceIndex = this.#piecesDictionary[piece.color][piece.GetType()].indexOf(piece);
        if (pieceIndex > -1) {
            this.#piecesDictionary[piece.color][piece.GetType()].splice(pieceIndex, 1);
        } else {
            throw new Error("Piece not found in dictionary");
        }

        this.#board.clear(rankIndex, fileIndex);
        return piece;
    }

    #getPiece(rank, file) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        return this.#board.read(rankIndex, fileIndex);
    }

    #getPieces(pieceColor = E_PieceType.Any, pieceType = E_PieceType.Any) {
        let pieces = [];
        if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) {
            for (let color of Object.values(E_PieceColor)) {
                for (let type of Object.values(E_PieceType)) {
                    pieces = pieces.concat(this.#piecesDictionary[color][type]);
                }
            }
        } else if (pieceColor === E_PieceColor.Any && pieceType !== E_PieceType.Any) {
            for (let color of Object.values(E_PieceColor)) {
                pieces = pieces.concat(this.#piecesDictionary[color][pieceType]);
            }
        } else if (pieceColor !== E_PieceColor.Any && pieceType === E_PieceType.Any) {
            for (let type of Object.values(E_PieceType)) {
                pieces = pieces.concat(this.#piecesDictionary[pieceColor][type]);
            }
        } else {
            pieces = pieces.concat(this.#piecesDictionary[pieceColor][pieceType]);
        }

        return pieces;
    }
}