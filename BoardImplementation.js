class BoardImplementation {
    #piecesDictionary = {}; //pieces categorized by color and type.
    #board = new Quadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);//board with piece objects.

    #castlingRights;
    #enPassantInfo;

    /**
    * Creates a new chess board
    * @param {string} inputFen FEN of board
    */
    constructor(inputFen, castlingRights, enPassantInfo) {
        assert(typeof inputFen === 'string', "Invalid FEN");

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
        for (let rankIndex = 0; rankIndex < NUMBER_OF_RANKS; rankIndex++) {
            for (let fileIndex = 0; fileIndex < NUMBER_OF_RANKS; fileIndex++) {

                //if there's a piece
                let pieceSymbol = inputBoard.read(rankIndex, fileIndex);
                if (pieceSymbol !== null) {
                    let pieceKey = Quadrille.chessKeys[pieceSymbol];

                    //create a piece
                    let rank = NUMBER_OF_RANKS - rankIndex;
                    let file = fileIndex + 1;
                    let pieceObject = this.#createPiece(pieceKey, rank, file);
                    //add piece
                    this.addPiece(pieceObject, rank, file);
                }
            }
        }

        this.#castlingRights = castlingRights;
        this.#enPassantInfo = enPassantInfo;
    }

    /**
     * Adds a piece object to given rank and file
     * @param {Piece} piece 
     * @param {Number} rank 
     * @param {Number} file 
     * @param {boolean} recordChange record addition so it can be undone?
     */
    addPiece(piece, rank, file) {
        assert(piece instanceof Piece, "Invalid piece");
        assertRank(rank);
        assertRank(file);

        if (this.getPieceOnRankFile(rank, file) !== null) {
            throw new Error("Cannot add piece in a occupied square");
        }

        this.#piecesDictionary[piece.color][piece.GetType()].push(piece);

        let rankIndex = NUMBER_OF_RANKS - rank;
        let fileIndex = file - 1;
        this.#board.fill(rankIndex, fileIndex, piece);
    }

    /**
     * Removes a piece in given rank and file and returns it
     * @param {Number} rank 
     * @param {Number} file 
     * @param {boolean} recordChange record removal so it can be undone?
     * @returns 
     */
    removePiece(rank, file) {
        assertRank(rank);
        assertRank(file);

        let pieceToRemove = this.getPieceOnRankFile(rank, file);

        if (pieceToRemove === null) {
            throw new Error("No piece to remove in given rank and file")
        }

        let pieceIndex = this.#piecesDictionary[pieceToRemove.color][pieceToRemove.GetType()].indexOf(pieceToRemove);
        if (pieceIndex > -1) {
            this.#piecesDictionary[pieceToRemove.color][pieceToRemove.GetType()].splice(pieceIndex, 1);
        } else {
            throw new Error("Piece not found in dictionary");
        }

        let rankIndex = NUMBER_OF_RANKS - rank;
        let fileIndex = file - 1;
        this.#board.clear(rankIndex, fileIndex);

        return pieceToRemove;
    }

    /**
     * 
     * @param {number} rank 
     * @param {File} file 
     * @returns Piece on given rank and file
     */
    getPieceOnRankFile(rank, file) {
        assertRank(rank);
        assertFile(file);
        let rankIndex = NUMBER_OF_RANKS - rank;
        let fileIndex = file - 1;
        return this.#board.read(rankIndex, fileIndex);
    }

    /**
     * 
     * @param {E_PieceColor} pieceColor 
     * @param {E_PieceType} pieceType 
     * @returns Shallow copy array of pieces of given characteristics 
     */
    getPiecesOfType(pieceColor = E_PieceType.Any, pieceType = E_PieceType.Any) {
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

        return [...pieces];
    }

    /**
     *
     * @param {E_PieceColor} pieceColor
     * @param {E_PieceType} pieceType
     * @returns {BigInt} Bitboard that contains pieces of given characteristics.
     */
    getOccupied(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
        assertPieceType(pieceType);
        assertPieceColor(pieceColor);

        let occupied = 0n;
        let pieces = [];

        if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) return this.#board.toBigInt();

        //for each piece of given type
        pieces = this.getPiecesOfType(pieceColor, pieceType);
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
        assertPieceType(pieceType);
        assertPieceColor(pieceColor);

        let attacksBitboard = 0n;
        //for every piece of given characteristics
        let pieces = this.getPiecesOfType(pieceColor, pieceType);
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
        assertPieceColor(kingColor);

        let king = this.getPiecesOfType(kingColor, E_PieceType.King)[0];
        if (king === undefined) return false;
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
        assertPieceColor(color);
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

            if (((col + 1) % NUMBER_OF_FILES) === 0) {
                string += "\n";
            }
        });

        console.log(string);
    }



    #createPiece(pieceKey, rank, file) {
        assertPieceKey(pieceKey);
        assertRank(rank);
        assertFile(file);

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


}