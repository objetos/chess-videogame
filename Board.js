//******  CLASS PROLOG, ASSERT AND DOCUMENT PRIVATE METHODS
class Board {
    static #FIRST_FILE = 0x0101010101010101n;
    static #FIRST_RANK = 0xFFn;

    #moveGenerator;

    #piecesDictionary = {}; //pieces categorized by color and type.
    #board = new Quadrille(8, 8);//board with piece objects.

    #boardChanges = [];
    #E_BoardChangeType = Object.freeze({
        Addition: Symbol("Addition"),
        Removal: Symbol("Removal"),
        CastlingRigthsChange: Symbol("CastlingRigthsChange"),
        EnPassantUpdate: Symbol("EnPassantUpdate"),
    })

    #castlingRights = {
        [E_PieceColor.White]: {
            [E_MoveFlag.KingSideCastling]: false,
            [E_MoveFlag.QueenSideCastling]: false
        }, [E_PieceColor.Black]: {
            [E_MoveFlag.KingSideCastling]: false,
            [E_MoveFlag.QueenSideCastling]: false
        }
    }

    #enPassantInfo = {
        rightToEnPassant: false,
        captureRank: null,
        captureFile: null
    }

    /**
     * Gives a bitboard with a single file.
     * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
     * @returns {BigInt} Bitboard that contains the specified file.
     */
    static getFile(fileNumber) {

        assertFile(fileNumber);

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

        assertRank(rankNumber);

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

        assertRank(rank);
        assertFile(file);

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

        assertRank(rank);
        assertFile(file);

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
        assert(typeof bitboard === "bigint", "Invalid bitboard");

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
     * Mirrors a bitboard along a vertical line.
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {BigInt} bitboard
     * @returns {BigInt} Mirrored bitboard
     */
    static #mirrorHorizontally(bitboard) {
        assert(typeof bitboard === "bigint", "Invalid bitboard");

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
        assert(typeof inputFen === 'string', "Invalid FEN");

        //initialize move generator
        this.#moveGenerator = new MoveGenerator();
        //initialize board
        let inputBoard = new Quadrille(inputFen);

        //initialize dictionary of pieces
        for (let color of Object.values(E_PieceColor)) {
            this.#piecesDictionary[color] = {}
            for (let type of Object.values(E_PieceType)) {
                this.#piecesDictionary[color][type] = new Array();
            }
        }

        //create pieces
        //for each square
        for (let rankIndex = 0; rankIndex < 8; rankIndex++) {
            for (let fileIndex = 0; fileIndex < 8; fileIndex++) {

                //if there's a piece
                let pieceSymbol = inputBoard.read(rankIndex, fileIndex);
                if (pieceSymbol !== null) {
                    let pieceKey = Quadrille.chessKeys[pieceSymbol];

                    //create a piece
                    let rank = 8 - rankIndex;
                    let file = fileIndex + 1;
                    let pieceObject = this.#createPiece(pieceKey, rank, file);
                    //add piece
                    this.addPiece(pieceObject, rank, file, false);
                }
            }
        }

        //calculate castling rights
        //for each color
        for (let color of Object.values(E_PieceColor)) {
            if (color === E_PieceColor.None || color === E_PieceColor.Any) continue;

            let king = this.#getPiecesOfType(color, E_PieceType.King).pop();
            //if board has no king or king has moved from initial square
            if (king === undefined || !king.isOnInitialSquare()) {
                //no castling is possible
                this.#setCastlingRights(color, E_MoveFlag.KingSideCastling, false);
                this.#setCastlingRights(color, E_MoveFlag.QueenSideCastling, false);
                continue;
            }

            let rooks = this.#getPiecesOfType(color, E_PieceType.Rook);
            for (let rook of rooks) {
                if (rook.isOnInitialSquare()) {
                    let castlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
                    this.#setCastlingRights(color, castlingSide, true);
                }
            }
        }
    }


    /**
     * @param {E_PieceColor} color
     * @return {Move[]} Array of legal moves of pieces of given color
     */
    generateMoves(pieceColor) {
        assert(Object.values(E_PieceColor).includes(pieceColor), "Invalid piece color");
        return this.#moveGenerator.generateMoves(this, this.#piecesDictionary, pieceColor);
    }

    /**
     *
     * @param {Move} move Applies move to board
     */
    makeMove(move) {
        //preconditions: Move is legal.
        //test: Print to visualize move is done, input incorrect moves and see response
        //errors: move to same spot, move out of bounds, no piece on rank or file, two pieces of same color in same square,

        assert(move instanceof Move, "Invalid input move");
        try {
            //start recording new board changes
            this.#recordNewBoardChanges();
            //update board information
            this.#updateCastlingRights(move);
            this.#updateEnPassantInfo(move);
            //apply move
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
                default:
                    throw new Error("Failed making move. Move has no valid flag");
            }
        } catch (error) {
            console.log(move);
            this.print();
            this.#popBoardChanges();
            throw error;
        }
    }

    /**
     * Undo's last move made in the board. If no move has been made, it will do nothing.
     */
    unmakeMove() {
        //test: Visual test.
        //errors: move to same spot, move out of bounds, no piece on rank or file, two pieces of same color in same square,

        //get last board changes 
        let lastChanges = this.#popBoardChanges();
        //if no changes, do nothing
        if (lastChanges === undefined) return;

        let numberOfChanges = lastChanges.length;
        //for each change
        for (let i = 0; i < numberOfChanges; i++) {
            let change = lastChanges.pop();
            //undo change
            switch (change.type) {
                case this.#E_BoardChangeType.Addition:
                    this.removePiece(change.rank, change.file, false);
                    break;
                case this.#E_BoardChangeType.Removal:
                    this.addPiece(change.piece, change.rank, change.file, false);
                    change.piece.SetPosition(change.rank, change.file);
                    break;
                case this.#E_BoardChangeType.CastlingRigthsChange:
                    this.#setCastlingRights(change.color, change.castlingSide, true);
                    break;
                case this.#E_BoardChangeType.EnPassantUpdate:
                    if (change.rightToEnPassant === true) {
                        this.#disableEnPassant();
                    } else {
                        this.#enableEnPassant(change.oldCaptureRank, change.oldCaptureFile);
                    }
                    break;

                default:
                    throw new Error("Invalid board change");
            }
        }
    }

    /**
     * Adds a piece object to given rank and file
     * @param {Piece} piece 
     * @param {Number} rank 
     * @param {Number} file 
     * @param {boolean} recordChange record addition so it can be undone?
     */
    addPiece(piece, rank, file, recordChange = true) {//****** piece already has rank and file
        assert(piece instanceof Piece, "Invalid piece");
        assertRank(rank);
        assertRank(file);
        assert(typeof recordChange === 'boolean', "Record change is not a boolean");

        if (this.#getPieceOnRankFile(rank, file) !== null) {
            throw new Error("Cannot add piece in a occupied square");
        }

        this.#piecesDictionary[piece.color][piece.GetType()].push(piece);

        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        this.#board.fill(rankIndex, fileIndex, piece);

        if (recordChange) {
            let addition = {
                type: this.#E_BoardChangeType.Addition,
                rank: rank,
                file: file
            };

            this.#pushBoardChange(addition);
        }
    }

    /**
     * Removes a piece in given rank and file and returns it
     * @param {Number} rank 
     * @param {Number} file 
     * @param {boolean} recordChange record removal so it can be undone?
     * @returns 
     */
    removePiece(rank, file, recordChange = true) {
        assertRank(rank);
        assertRank(file);
        assert(typeof recordChange === 'boolean', "Record change is not a boolean");

        let pieceToRemove = this.#getPieceOnRankFile(rank, file);

        if (pieceToRemove === null) {
            throw new Error("No piece to remove in given rank and file")
        }

        if (recordChange) {
            let removal = {
                type: this.#E_BoardChangeType.Removal,
                rank: rank,
                file: file,
                piece: pieceToRemove
            };
            this.#pushBoardChange(removal);
        }

        let pieceIndex = this.#piecesDictionary[pieceToRemove.color][pieceToRemove.GetType()].indexOf(pieceToRemove);
        if (pieceIndex > -1) {
            this.#piecesDictionary[pieceToRemove.color][pieceToRemove.GetType()].splice(pieceIndex, 1);
        } else {
            throw new Error("Piece not found in dictionary");
        }

        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        this.#board.clear(rankIndex, fileIndex);

        return pieceToRemove;
    }


    /**
     *
     * @param {E_PieceColor} pieceColor
     * @param {E_PieceType} pieceType
     * @returns {BigInt} Bitboard that contains pieces of given characteristics.
     */
    getOccupied(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
        assert(Object.values(E_PieceType).includes(pieceType), "Piece type not defined");
        assert(Object.values(E_PieceColor).includes(pieceColor), "Piece color not defined");

        let occupied = 0n;
        let pieces = [];

        if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) return this.#board.toBigInt();

        //for each piece of given type
        pieces = this.#getPiecesOfType(pieceColor, pieceType);
        for (let piece of pieces) {
            //get location in board
            let position = piece.position;
            //add it to occupied
            occupied = occupied | position;
        }

        return occupied;
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

    /**
     * 
     * @param {E_PieceColor} pieceColor 
     * @param {E_PieceType} pieceType 
     * @returns Bitboard with squares being attacked by pieces of given characteristics 
     */
    getAttackedSquares(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
        assert(Object.values(E_PieceType).includes(pieceType), "Invalid piece type");
        assert(Object.values(E_PieceColor).includes(pieceColor), "Invalid piece color");

        let attacksBitboard = 0n;
        //for every piece of given characteristics
        let pieces = this.#getPiecesOfType(pieceColor, pieceType);
        pieces.forEach(piece => {

            let pieceAttackMoves;
            //if not a pawn,get regular moves
            if (piece.GetType() !== E_PieceType.Pawn) {
                pieceAttackMoves = piece.GetMoves(this);
            } //otherwise, get squares that pawn would capture if there was a piece there
            else {
                pieceAttackMoves = piece.GetCapturingSquares();
            }

            //add moves to attacks
            attacksBitboard |= pieceAttackMoves;
        });

        return attacksBitboard;
    }

    /**
     * 
     * @param {E_PieceColor} kingColor 
     * @returns Whether the king of given color is being checked or not
     */
    isKingInCheck(kingColor) {
        assert(Object.values(E_PieceColor).includes(kingColor), "Invalid piece color");

        let king = this.#getPiecesOfType(kingColor, E_PieceType.King)[0];
        let squaresAttackedByEnemy = this.getAttackedSquares(OppositePieceColor(kingColor));
        //if king position and attacked squares intersect, king is in check
        return (king.position & squaresAttackedByEnemy) > 0n;
    }

    /**
     * 
     * @param {E_PieceColor} color 
     * @param {E_MoveFlag} castlingSide 
     * @returns Whether the given side has rights to castle (It does not necesarilly mean castling is possible).
     */
    hasCastlingRights(color, castlingSide) {
        assert(Object.values(E_PieceColor).includes(color), "Invalid piece color");
        assert(castlingSide === E_MoveFlag.QueenSideCastling || castlingSide === E_MoveFlag.KingSideCastling, "Invalid castling side");

        return this.#castlingRights[color][castlingSide];
    }
    /**
     * 
     * @returns Object with information about en passant capture
     */
    getEnPassantInfo() {
        return this.#enPassantInfo;
    }

    /**
     * Draws board
     */
    draw() {
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

    #createPiece(pieceKey, rank, file) {
        let pieceObject = null;
        switch (pieceKey) {
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
                throw new Error("Incorrect piece type:" + pieceKey);
        }
        return pieceObject;
    }

    #getPieceOnRankFile(rank, file) {
        let rankIndex = 8 - rank;
        let fileIndex = file - 1;
        return this.#board.read(rankIndex, fileIndex);
    }

    #getPiecesOfType(pieceColor = E_PieceType.Any, pieceType = E_PieceType.Any) {
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


    #makeRegularMove(move) {
        //if there's a piece in destination
        let pieceInDestination = this.#getPieceOnRankFile(move.endRank, move.endFile);
        if (pieceInDestination !== null) {
            //capture it
            this.removePiece(move.endRank, move.endFile);
        }

        //move piece
        let pieceToMove = this.#getPieceOnRankFile(move.startRank, move.startFile);
        this.removePiece(move.startRank, move.startFile);
        this.addPiece(pieceToMove, move.endRank, move.endFile);
        pieceToMove.SetPosition(move.endRank, move.endFile);
    }

    #makePromotionMove(move) {
        //move pawn
        this.#makeRegularMove(move);
        //remove pawn
        let pawn = this.removePiece(move.endRank, move.endFile);
        //create new piece
        let pieceTypeToPromote = Input.pieceSelectedForPromotion;
        let pieceColor = pawn.color;
        let pieceString = colorTypeToString(pieceColor, pieceTypeToPromote);
        let newPiece = this.#createPiece(pieceString, move.endRank, move.endFile);
        //add promoted piece
        this.addPiece(newPiece, move.endRank, move.endFile);
    }

    #makeCastlingMove(move) {
        //move  king
        this.#makeRegularMove(move);
        //move rook
        let rookMove = new Move(
            move.startRank,
            CASTLING_FILES[move.flag][E_PieceType.Rook].startFile,
            move.startRank,
            CASTLING_FILES[move.flag][E_PieceType.Rook].endFile,
            E_MoveFlag.Regular
        );
        this.#makeRegularMove(rookMove);
    }

    #makeEnPassantMove(move) {
        //move pawn
        this.#makeRegularMove(move);
        //remove captured pawn
        this.removePiece(move.startRank, move.endFile);
    }

    #recordNewBoardChanges() {
        this.#boardChanges.push([]);
    }

    #pushBoardChange(change) {
        let lastChanges = this.#boardChanges[this.#boardChanges.length - 1];
        lastChanges.push(change);
    }

    #popBoardChanges() {
        return this.#boardChanges.pop();
    }

    #updateCastlingRights(move) {
        let pieceInStart = this.#getPieceOnRankFile(move.startRank, move.startFile);
        let pieceInDestination = this.#getPieceOnRankFile(move.endRank, move.endFile);

        //if it is a castling move
        let isCastlingMove = move.flag === E_MoveFlag.KingSideCastling | move.flag === E_MoveFlag.QueenSideCastling;
        if (isCastlingMove) {

            //remove castling rights from both sides
            let king = pieceInStart;
            let castlingSide = move.flag;
            let oppositeCastlingSide = move.flag === E_MoveFlag.KingSideCastling ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
            this.#disableCastlingRights(king.color, castlingSide);
            this.#disableCastlingRights(king.color, oppositeCastlingSide);

        } else {

            //if a rook is moving
            if (pieceInStart.GetType() === E_PieceType.Rook) {
                let rook = pieceInStart;
                let rookCastlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;

                //if the rook that's moving is on its initial corner and hasn't moved
                if (rook.isOnInitialSquare() && this.hasCastlingRights(rook.color, rookCastlingSide)) {
                    //Remove castling rights from this rook's side
                    this.#disableCastlingRights(rook.color, rookCastlingSide);
                }
            } //else if a king is moving
            else if (pieceInStart.GetType() === E_PieceType.King) {
                let king = pieceInStart;
                //if the king has not moved before
                let hasKingMoved = !(king.isOnInitialSquare() &&
                    this.hasCastlingRights(king.color, E_MoveFlag.KingSideCastling) &&
                    this.hasCastlingRights(king.color, E_MoveFlag.QueenSideCastling));
                if (!hasKingMoved) {
                    //remove castling rights from both sides
                    this.#disableCastlingRights(king.color, E_MoveFlag.KingSideCastling);
                    this.#disableCastlingRights(king.color, E_MoveFlag.QueenSideCastling);
                }
            }

            //if a rook is captured
            if (pieceInDestination !== null && pieceInDestination.GetType() === E_PieceType.Rook) {
                let rook = pieceInDestination;
                let rookCastlingSide = rook.file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;

                //if the rook that's being captured is on its initial corner  and hasn't moved
                if (rook.isOnInitialSquare() && this.hasCastlingRights(rook.color, rookCastlingSide)) {
                    //remove castling rights from the captured rook's side
                    this.#disableCastlingRights(rook.color, rookCastlingSide);
                }
            }
        }
    }

    #setCastlingRights(color, castlingSide, enabled) {
        this.#castlingRights[color][castlingSide] = enabled;
    }

    #disableCastlingRights(color, castlingSide) {
        if (this.hasCastlingRights(color, castlingSide)) {
            this.#castlingRights[color][castlingSide] = false;
            //record change
            let disableCastlingRights = {
                type: this.#E_BoardChangeType.CastlingRigthsChange,
                color: color,
                castlingSide: castlingSide
            }
            this.#pushBoardChange(disableCastlingRights);
        }
    }

    #updateEnPassantInfo(move) {
        let pieceInStart = this.#getPieceOnRankFile(move.startRank, move.startFile);
        let pawnPerfomedJump = pieceInStart.GetType() === E_PieceType.Pawn && Math.abs(move.startRank - move.endRank) === 2;
        let isEnPassantEnabled = this.#enPassantInfo.rightToEnPassant;
        //if a pawn performs a jump
        if (pawnPerfomedJump) {
            //enable en passant with the square this pawn jumps to
            this.#enableEnPassant(move.endRank, move.endFile);
            //record change
            let enPassantUpdate = {
                type: this.#E_BoardChangeType.EnPassantUpdate,
                rightToEnPassant: true
            }
            this.#pushBoardChange(enPassantUpdate);
        }
        //else, if any other move is performed and en passant is enabled
        else if (isEnPassantEnabled) {
            //record change
            let enPassantUpdate = {
                type: this.#E_BoardChangeType.EnPassantUpdate,
                rightToEnPassant: false,
                oldCaptureRank: this.#enPassantInfo.captureRank,
                oldCaptureFile: this.#enPassantInfo.captureFile
            }
            this.#pushBoardChange(enPassantUpdate);
            //disable en passant
            this.#disableEnPassant();
        }


    }

    #enableEnPassant(captureRank, captureFile) {
        assertRank(captureRank);
        assertRank(captureFile);
        this.#enPassantInfo.rightToEnPassant = true;
        this.#enPassantInfo.captureRank = captureRank;
        this.#enPassantInfo.captureFile = captureFile;
    }

    #disableEnPassant() {
        this.#enPassantInfo.rightToEnPassant = false;
        this.#enPassantInfo.captureRank = null;
        this.#enPassantInfo.captureFile = null;
    }
}