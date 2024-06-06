var Chess = (function (exports) {
    'use strict';

    const E_PieceColor = Object.freeze({
        Black: Symbol("Black"),
        White: Symbol("White"),
        None: Symbol("None"),
        Any: Symbol("Any")
    });

    const E_GameState = Object.freeze({
        PLAYING: Symbol("Playing"),
        CHECKMATE: Symbol("Checkmate"),
        STALEMATE: Symbol("Stalemate"),
        DRAW: Symbol("Draw"),
        RESIGNED: Symbol("Resigned"),
    });

    //GAME STATES 
    const E_GameMode = Object.freeze({
        STANDARD: Symbol("Standard"),
        AUTOMATIC: Symbol("Automatic"),
        FREE: Symbol("Free"),
    });

    const E_MoveFlag = Object.freeze({
        Promotion: Symbol("Promotion"),
        Castling: Symbol("Castling"),
        EnPassant: Symbol("EnPassant"),
        Regular: Symbol("Regular"),
        None: Symbol("None")
    });

    const E_PieceType = Object.freeze({
        King: Symbol("King"),
        Queen: Symbol("Queen"),
        Bishop: Symbol("Bishop"),
        Rook: Symbol("Rook"),
        Knight: Symbol("Knight"),
        Pawn: Symbol("Pawn"),
        None: Symbol("None"),
        Any: Symbol("Any")
    });

    function assert(condition, message) {
        if (!condition) {
            let error = new Error();
            let stack = error.stack;
            let firstLineSkipIndex = stack.indexOf("\n");
            let secondLineSkipIndex = stack.indexOf("\n", firstLineSkipIndex + 2);
            let thisFunctionCall = stack.substring(firstLineSkipIndex, secondLineSkipIndex);
            stack = stack.replace(thisFunctionCall, "");
            console.log(stack);
            throw message || "Assertion failed";
        }
    }

    function assertRank(rank) {
        assert(rank !== undefined, "No rank provided");
        assert(typeof rank === "number", "Rank Invalid");
        assert(Number.isInteger(rank), "Rank is not an integer");
        assert(rank >= 1 && rank <= NUMBER_OF_RANKS, "Rank " + rank + " is out of bounds.");

    }

    function assertFile(file) {
        assert(file !== undefined, "No file provided");
        assert(typeof file === "number", "File Invalid");
        assert(Number.isInteger(file), "File is not an integer");
        assert(file >= 1 && file <= NUMBER_OF_FILES, "File " + file + " is out of bounds.");
    }

    function assertPieceColor(pieceColor) {
        assert(Object.values(E_PieceColor).includes(pieceColor), "Invalid piece color");
        assert(pieceColor !== E_PieceColor.None, "No piece color provided");
    }

    function assertPieceType(pieceType) {
        assert(Object.values(E_PieceType).includes(pieceType), "Invalid piece type");
        assert(pieceType !== E_PieceType.None, "No piece type provided");
    }

    function assertPieceKey(pieceKey) {
        assert(Object.values(Quadrille.chessKeys).includes(pieceKey), "Invalid piece key");
    }

    //class prolog

    class Move {
        #startRank;
        #startFile;
        #endRank;
        #endFile;
        #flag;

        /**
         * Creates a new move
         * @param {number} startRank 
         * @param {number} startFile 
         * @param {number} destinationRank 
         * @param {number} destinationFile 
         * @param {E_MoveFlag} flag 
         */
        constructor(startRank, startFile, destinationRank, destinationFile, flag = E_MoveFlag.None) {

            this.#assertMove(startRank, startFile, destinationRank, destinationFile, flag);

            this.#startRank = startRank;
            this.#startFile = startFile;
            this.#endRank = destinationRank;
            this.#endFile = destinationFile;
            this.#flag = flag;
        }

        get startRank() {
            return this.#startRank;
        }

        get startFile() {
            return this.#startFile;
        }

        get endRank() {
            return this.#endRank;
        }

        get endFile() {
            return this.#endFile;
        }

        get flag() {
            return this.#flag;
        }

        #assertMove(startRank, startFile, endRank, endFile, flag) {
            assertRank(startRank);
            assertRank(endRank);
            assertFile(startFile);
            assertFile(endFile);
            assert(!((startRank === endRank) && (startFile === endFile)), "Invalid move. Start and destination squares are the same");
        }
    }

    const E_CastlingSide = Object.freeze({
        QueenSide: Symbol("QueenSide"),
        KingSide: Symbol("KingSide"),
        None: Symbol("None")
    });

    const NUMBER_OF_RANKS = 8;
    const NUMBER_OF_FILES = 8;

    /**
     * Files involved in castling. Provide castling side and piece which is moving (rook or king)
     */
    const CASTLING_FILES = {
        [E_CastlingSide.QueenSide]: {
            [E_PieceType.King]: {
                startFile: 5,
                endFile: 3
            },
            [E_PieceType.Rook]: {
                startFile: 1,
                endFile: 4
            },
        },
        [E_CastlingSide.KingSide]: {
            [E_PieceType.King]: {
                startFile: 5,
                endFile: 7
            },
            [E_PieceType.Rook]: {
                startFile: 8,
                endFile: 6
            }
        }
    };

    /**
     * Ranks where pawns can promote. Provide color
     */
    const RANKS_TO_PROMOTE = {
        [E_PieceColor.White]: 7,
        [E_PieceColor.Black]: 2
    };

    /**
     * Ranks where pawns can perform an en-passant capture. Provide color.
     */
    const ENPASSANT_CAPTURING_RANKS = {
        [E_PieceColor.White]: 5,
        [E_PieceColor.Black]: 4
    };

    /**
     * Piece types that a pawn can promote to.
     */
    const PIECE_TYPES_TO_PROMOTE = [
        E_PieceType.Bishop,
        E_PieceType.Knight,
        E_PieceType.Queen,
        E_PieceType.Rook
    ];

    /**
     * 
     * @param {E_PieceColor} pieceColor 
     * @returns Opposite color of given piece color
     */
    function OppositePieceColor(pieceColor) {
        assertPieceColor(pieceColor);
        switch (pieceColor) {
            case E_PieceColor.White:
                return E_PieceColor.Black;
            case E_PieceColor.Black:
                return E_PieceColor.White;
            default:
                throw Error("No color specified");
        }
    }

    /**
     * Provide type to return lowercase piece key
     */
    const PIECE_KEYS_BY_TYPE = {
        [E_PieceType.King]: 'k',
        [E_PieceType.Bishop]: 'b',
        [E_PieceType.Knight]: 'n',
        [E_PieceType.Queen]: 'q',
        [E_PieceType.Pawn]: 'p',
        [E_PieceType.Rook]: 'r'
    };

    /**
     * Provide piece key in lowercase to return piece type
     */
    const PIECE_TYPE_BY_KEY = {
        'k': E_PieceType.King,
        'b': E_PieceType.Bishop,
        'n': E_PieceType.Knight,
        'q': E_PieceType.Queen,
        'p': E_PieceType.Pawn,
        'r': E_PieceType.Rook
    };

    /**
     * Transforms piece color and type to piece key
     * @param {E_PieceColor} pieceColor 
     * @param {E_PieceType} pieceType 
     * @returns piece key
     */
    function pieceColorTypeToKey(pieceColor, pieceType) {
        assertPieceColor(pieceColor);
        assertPieceType(pieceType);

        assert(pieceColor !== E_PieceColor.Any, "No piece color provided");
        assert(pieceType !== E_PieceType.Any, "No piece type provided");

        let pieceString = PIECE_KEYS_BY_TYPE[pieceType];

        if (pieceColor === E_PieceColor.White) {
            pieceString = pieceString.toUpperCase();
        }

        return pieceString;
    }

    /**
     * Transforms a piece key into its color
     * @param {string} pieceKey 
     * @returns Piece color
     */
    function pieceKeyToColor(pieceKey) {
        assertPieceKey(pieceKey);
        let color = pieceKey == pieceKey.toUpperCase() ? E_PieceColor.White : E_PieceColor.Black;
        return color;
    }

    /**
     * Transforms a piece key into its type
     * @param {string} pieceKey 
     * @returns Piece type
     */
    function pieceKeyToType(pieceKey) {
        assertPieceKey(pieceKey);
        return PIECE_TYPE_BY_KEY[pieceKey.toLowerCase()];
    }

    /**
     * Converts a file number into its letter representation
     * @param {number} file 
     * @returns 
     */
    function FileToLetter(file) {
        assertFile(file);
        return String.fromCharCode(96 + file);
    }

    /**
     * 
     * @param {Move} move 
     * @returns move in algebraic notation
     */
    function MoveToString(move) {
        assert(move instanceof Move, "Invalid move");
        let startFileLetter = FileToLetter(move.startFile);
        let endFileLetter = FileToLetter(move.endFile);
        return startFileLetter + move.startRank + endFileLetter + move.endRank;
    }

    var ChessUtils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CASTLING_FILES: CASTLING_FILES,
        ENPASSANT_CAPTURING_RANKS: ENPASSANT_CAPTURING_RANKS,
        FileToLetter: FileToLetter,
        MoveToString: MoveToString,
        NUMBER_OF_FILES: NUMBER_OF_FILES,
        NUMBER_OF_RANKS: NUMBER_OF_RANKS,
        OppositePieceColor: OppositePieceColor,
        PIECE_TYPES_TO_PROMOTE: PIECE_TYPES_TO_PROMOTE,
        RANKS_TO_PROMOTE: RANKS_TO_PROMOTE,
        pieceColorTypeToKey: pieceColorTypeToKey,
        pieceKeyToColor: pieceKeyToColor,
        pieceKeyToType: pieceKeyToType
    });

    //UI SETTINGS ----------------------------------------------------------------
    //--Board--
    const BOARD_UI_SETTINGS = {
        SQUARE_SIZE: 40,
        get WIDTH() { return this.SQUARE_SIZE * NUMBER_OF_FILES },
        get HEIGHT() { return this.SQUARE_SIZE * NUMBER_OF_RANKS },
        LOCAL_POSITION: {
            get x() { return BOARD_UI_SETTINGS.SQUARE_SIZE },
            get y() { return GAME_STATE_UI_SETTINGS.HEIGHT + GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD }
        },
        WHITE_SQUARE_COLOR: '#ffffff',
        BLACK_SQUARE_COLOR: '#44c969',
        OUTLINE: '#44c969',
        PIECES_SIZE: 35,
        PIECES_COLOR: '#000000'
    };
    //--Pieces Captured UI--
    const PIECES_CAPTURED_UI_SETTINGS = {
        PIECES_SIZE: 30,
        SPACE_FROM_BOARD: 10,
        get WHITE_PIECES_POSITION() {
            return {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y - this.PIECES_SIZE - this.SPACE_FROM_BOARD
            }
        },
        get BLACK_PIECES_POSITION() {
            return {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT + this.SPACE_FROM_BOARD + RANKS_FILES_UI_SETTING.CELL_LENGTH
            }
        }
    };
    //--Game State UI--
    const GAME_STATE_UI_SETTINGS = {
        TEXT_SIZE: 20,
        TEXT_MARGIN: 10,
        SPACE_FROM_BOARD: 55,
        WIDTH: BOARD_UI_SETTINGS.WIDTH,
        get HEIGHT() {
            return this.TEXT_SIZE + 2 * this.TEXT_MARGIN;
        },
        get POSITION() {
            return {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y - this.TEXT_SIZE - this.TEXT_MARGIN - this.SPACE_FROM_BOARD
            }
        }
    };
    //--Move Record UI--
    const MOVE_RECORD_UI_SETTINGS = {
        CELL_LENGTH: 40,
        SPACE_FROM_BOARD: 20,
        MAX_ROWS_VISIBLE: 8,
        BUTTON_SPACE_FROM_TABLE: 20,
        BUTTON_WIDTH: 50,
        BUTTON_HEIGHT: 20,
        get POSITION() {
            return {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x + BOARD_UI_SETTINGS.WIDTH + this.SPACE_FROM_BOARD,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y
            }
        },
        ROW_HEIGHT: BOARD_UI_SETTINGS.SQUARE_SIZE,
        get TABLE_WIDTH() { return BOARD_UI_SETTINGS.SQUARE_SIZE * 3 },
        get TABLE_HEIGHT() { return this.ROW_HEIGHT * this.MAX_ROWS_VISIBLE },
        get WIDTH() { return this.TABLE_WIDTH + this.BUTTON_SPACE_FROM_TABLE + this.BUTTON_WIDTH },
        get HEIGHT() { return this.ROW_HEIGHT * this.MAX_ROWS_VISIBLE }
    };
    //--Resign Button--
    const RESIGN_BUTTON_UI_SETTINGS = {
        POSITION: {
            x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
            y: MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS.ROW_HEIGHT + 20
        },
        WIDTH: 40,
        HEIGHT: 20,
        TEXT: "Resign"
    };
    //--Rank Files UI--
    const RANKS_FILES_UI_SETTING = {
        CELL_LENGTH: BOARD_UI_SETTINGS.SQUARE_SIZE,
        TEXT_ZOOM: 0.5,
        TEXT_COLOR: 0,
        RANKS: new Quadrille(1, ['8', '7', '6', '5', '4', '3', '2', '1']),
        FILES: new Quadrille(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    };

    const MOVE_INPUT_UI_SETTINGS = {
        COLOR_FOR_SELECTED_SQUARES: 'rgba(100,100,100,0.5)',
        COLOR_FOR_AVAILABLE_MOVES: 'rgba(245, 246, 130,0.7)'
    };
    //--Promotion Selector--
    const PROMOTION_SELECTOR_SETTINGS = {
        BACKGROUND_COLOR: 'rgba(255,255,255,1)'
    };

    const FIRST_FILE_BITBOARD = 0x0101010101010101n;
    const FIRST_RANK_BITBOARD = 0xFFn;

    /**
     * 
     * @param {number} rank 
     * @param {number} file 
     * @returns Bitboard that holds the square given by rank and file
     */
    function squareToBitboard(rank, file) {
        assertRank(rank);
        assertFile(file);
        //move to file
        let bitboard = 1n << BigInt(NUMBER_OF_FILES - file);
        //move to rank
        bitboard = bitboard << BigInt((rank - 1) * NUMBER_OF_RANKS);
        return bitboard;
    }

    /**
     * 
     * @param {number} startRank 
     * @param {number} startFile 
     * @param {number} destinationRank 
     * @param {number} destinationFile 
     * @param {boolean} includeStart Should the ray contain the start square?
     * @param {boolean} includeDestination Should the ray contain the destination square?
     * @returns Bitboard that holds a ray from given start and end square  
     */
    function getRay(startRank, startFile, destinationRank, destinationFile, includeStart = true, includeDestination = true) {
        assertRank(startRank);
        assertRank(destinationRank);
        assertRank(startFile);
        assertFile(destinationFile);
        assert(typeof includeStart === 'boolean', "includeStart is not boolean");
        assert(typeof includeStart === 'boolean', "includeDestination is not boolean");

        let start = squareToBitboard(startRank, startFile);
        let destination = squareToBitboard(destinationRank, destinationFile);

        //if start and destination are the same
        if (startRank === destinationRank && startFile === destinationFile) {
            if (includeStart || includeDestination) return start;//return start or destination if included 
            else return 0n; //else return empty ray
        }

        let rankDiff = destinationRank - startRank;
        let fileDiff = destinationFile - startFile;
        let isPositiveRay = false;
        let mask = 0n;

        if (startRank === destinationRank) {
            //horizontal ray
            mask = getRank(startRank);
            isPositiveRay = destinationFile < startFile;
        } else if (startFile === destinationFile) {
            //vertical ray
            mask = getFile(startFile);
            isPositiveRay = startRank < destinationRank;
        } else if (Math.abs(rankDiff) === Math.abs(fileDiff)) {
            //diagonal ray
            let isDiagonal = Math.sign(rankDiff) === Math.sign(fileDiff);
            if (isDiagonal) {
                mask = getDiagonal(startRank, startFile);
                isPositiveRay = 0 < rankDiff && 0 < fileDiff;
            } else {
                mask = getAntiDiagonal(startRank, startFile);
                isPositiveRay = 0 < rankDiff && fileDiff < 0;
            }
        } else {
            //no ray is possible
            return 0n;
        }

        let rays = hyperbolaQuintessenceAlgorithm(destination, start, mask);
        let ray = isPositiveRay ? rays.positiveRay : rays.negativeRay;

        if (includeStart) ray = ray | start;
        if (!includeDestination) ray = ray & ~destination;

        return ray;
    }

    /**
     * Calculates a sliding ray from given position to any square blocked by occupied in the direction of mask.
     * Calculates usign o^(o-2r) trick. 
     * Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.
     * @param {bigint} occupied Bitboard with occupied squares
     * @param {bigint} position Bitboard with position of piece
     * @param {bigint} mask Bitboard with sliding direction
     * @returns Bitboard with sliding ray
     */
    function hyperbolaQuintessenceAlgorithm(occupied, position, mask) {
        assert(typeof occupied === 'bigint', "Argument is not a BigInt");
        assert(typeof position === 'bigint', "Argument is not a BigInt");
        assert(typeof mask === 'bigint', "Argument is not a BigInt");

        let blockers = occupied & mask;
        let positiveRay = ((blockers - 2n * position) ^ occupied) & mask;
        let negativeRay = (reverseBitboard((reverseBitboard(blockers) - 2n * reverseBitboard(position))) ^ occupied) & mask;
        return {
            wholeRay: positiveRay | negativeRay,
            positiveRay: positiveRay,
            negativeRay: negativeRay
        };
    }

    /**
     * 
     * @param {bigint} bitboard 
     * @returns Bitboard reversed
     */
    function reverseBitboard(bitboard) {
        assert(typeof bitboard === 'bigint', "Invalid bitboard");
        let bitboardString = bitboardToString(bitboard);

        //complete to 64 bits
        let numberOfBits = bitboardString.length;
        if (bitboardString.length < 64) {
            let bitsLeftToAdd = 64 - numberOfBits;
            bitboardString = "0".repeat(bitsLeftToAdd) + bitboardString;
        }

        //reverse bitboard
        let reversedBitboardString = bitboardString.split('').reverse().join('');
        let reversedBitboard = BigInt("0b" + reversedBitboardString);
        return reversedBitboard;
    }

    /**
     * 
     * @param {bigint} bitboard 
     * @returns Bitboard as a string
     */
    function bitboardToString(bitboard) {
        assert(typeof bitboard === 'bigint', "Invalid bitboard");
        let bitboardString;

        if (0 <= bitboard) {
            bitboardString = bitboard.toString(2);
        } else {
            bitboardString = BigInt.asUintN(64, bitboard).toString(2);
        }

        return bitboardString;
    }

    /**
     * Returns two's complement of a binary string. Taken from:https : https://stackoverflow.com/questions/70710579/javascript-bigint-print-unsigned-binary-represenation
     * @param {string} binaryString 
     */
    function twosComplement(binaryString) {
        let complement = BigInt('0b' + binaryString.split('').map(e => e === "0" ? "1" : "0").join(''));
        return complement + BigInt(1);
    }

    /**
     * Prints bitboard to console
     * @param {bigint} bitboard 
     */
    function printBitboard(bitboard) {
        assert(typeof bitboard === 'bigint', "Invalid bitboard");

        let bitboardString = bitboardToString(bitboard);

        let newString = "";

        for (let i = 0; i < 64; i++) {
            if (i < bitboardString.length) {
                newString = bitboardString.charAt(bitboardString.length - 1 - i) + " " + newString;
            } else {
                newString = 0 + " " + newString;
            }

            if (((i + 1) % NUMBER_OF_FILES) === 0) {
                newString = "\n" + newString;
            }
        }
        console.log(newString);
    }

    /**
     * 
     * @param {boolean} bool 
     * @returns If true, a bitboard full of 1's. Otherwise, returns 0.
     */
    function getBooleanBitboard(bool) {
        assert(typeof bool === 'boolean', "Invalid argument");
        if (bool) {
            return 0xFFFFFFFFFFFFFFFFn;
        } else {
            return 0x0000000000000000n;
        }
    }

    /**
     * Gives a bitboard with a single file.
     * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
     * @returns {bigint} Bitboard that contains the specified file.
     */
    function getFile(fileNumber) {
        assertFile(fileNumber);
        let fileBitboard = FIRST_FILE_BITBOARD;
        //Move first file n positions
        fileBitboard = fileBitboard << BigInt(8 - fileNumber);
        return fileBitboard;
    }

    /**
     * Gives a bitboard with a single file.
     * @param {number} rankNumber Number of the rank, going from 1 to 8, where 1 is the bottom row of the board.
     * @returns {bigint} Bitboard that contains the specified rank.
     */
    function getRank(rankNumber) {

        assertRank(rankNumber);

        let rankBitboard = FIRST_RANK_BITBOARD;
        //Move first rank n positions
        rankBitboard = rankBitboard << BigInt((rankNumber - 1) * NUMBER_OF_RANKS);
        return rankBitboard;
    }

    /**
     * Gives a bitboard with a single diagonal that contains the square given by rank and file.
     * @param {number} rank
     * @param {number} file
     * @returns {bigint} Bitboard that contains the diagonal.
     */
    function getDiagonal(rank, file) {

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
            diagonalBitboard = (diagonalBitboard << 1n) | (1n << BigInt(8 * i));
        }

        // Flip diagonally for diagonals greater than the eight one.
        if (8 < diagonalNumber) {
            diagonalBitboard = flipDiagonally(diagonalBitboard);
        }

        return diagonalBitboard;
    }

    /**
     * Gives a bitboard with a single antidiagonal that contains the square given by rank and file.
     * @param {number} rank
     * @param {number} file
     * @returns {bigint} Bitboard that contains the antidiagonal.
     */
    function getAntiDiagonal(rank, file) {

        assertRank(rank);
        assertFile(file);

        // Get a normal diagonal
        let diagonalBitboard = getDiagonal(rank, 9 - file);
        // Mirror the diagonal horizontally to get an antiDiagonal.
        let antiDiagonalBitboard = mirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }

    /**
     * Flips a bitboard along the 8th diagonal (middle diagonal).
     * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
     * @param {bigint} bitboard
     * @returns {bigint} Flipped bitboard
     */
    function flipDiagonally(bitboard) {
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
     * @param {bigint} bitboard
     * @returns {bigint} Mirrored bitboard
     */
    function mirrorHorizontally(bitboard) {
        assert(typeof bitboard === "bigint", "Invalid bitboard");

        let k1 = 0x5555555555555555n;
        let k2 = 0x3333333333333333n;
        let k4 = 0x0f0f0f0f0f0f0f0fn;

        bitboard = ((bitboard >> 1n) & k1) | ((bitboard & k1) << 1n);
        bitboard = ((bitboard >> 2n) & k2) | ((bitboard & k2) << 2n);
        bitboard = ((bitboard >> 4n) & k4) | ((bitboard & k4) << 4n);

        return bitboard;
    }

    var BitboardUtils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        bitboardToString: bitboardToString,
        flipDiagonally: flipDiagonally,
        getAntiDiagonal: getAntiDiagonal,
        getBooleanBitboard: getBooleanBitboard,
        getDiagonal: getDiagonal,
        getFile: getFile,
        getRank: getRank,
        getRay: getRay,
        hyperbolaQuintessenceAlgorithm: hyperbolaQuintessenceAlgorithm,
        mirrorHorizontally: mirrorHorizontally,
        printBitboard: printBitboard,
        reverseBitboard: reverseBitboard,
        squareToBitboard: squareToBitboard,
        twosComplement: twosComplement
    });

    /*
    ****** class prolog
    */
    class Piece {
        #color = E_PieceColor.None;
        #rank = 0;
        #file = 0;
        #position = 0;

        /**
         * Creates new piece object
         * 
         * @param {E_PieceColor} color Color of piece.
         * @param {number} file File of piece's position.
         * @param {number} rank Rank of piece's position.
         */
        constructor(color, rank, file) {
            if (this.constructor === Piece) {
                console.log(constructor);
                throw new Error("Abstract classes can't be instantiated.");
            }

            assertPieceColor(color);
            assertRank(rank);
            assertFile(file);

            this.#color = color;
            this.#rank = rank;
            this.#file = file;

            this.#position = squareToBitboard(rank, file);
            this.#rank = rank;
            this.#file = file;
        }

        get position() {
            return this.#position;
        }

        get color() {
            return this.#color;
        }

        get rank() {
            return this.#rank;
        }

        get file() {
            return this.#file;
        }

        /**
         * @returns {E_PieceType} Type of piece
         */
        GetType() {
            throw new Error("Method 'GetType()' must be implemented.");
        }

        /**
         * Returns bitboard that contains legal positions this piece can move to
         * @param {BoardImplementation} board 
         */
        GetMoves(board) {
            throw new Error("Method 'GetMoves()' must be implemented.");
        }

        IsSlider() {
            return false;
        }

        toString() {
            let typeString = this.GetType().toString();

            if (this.GetType() === E_PieceType.Knight) {
                typeString = typeString.charAt(8);
            } else {
                typeString = typeString.charAt(7);
            }

            if (this.#color === E_PieceColor.Black) {
                typeString = typeString.toLowerCase();
            } else {
                typeString = typeString.toUpperCase();
            }

            return typeString;
        }
    }

    class SlidingPiece extends Piece {

        GetType() {
            throw new Error("Method 'GetType()' must be implemented.");
        }

        getSlidingRays() {
            throw new Error("Method 'GetType()' must be implemented.");
        }

        IsSlider() {
            return true;
        }

        /**
         * 
         * @param {BoardImplementation} board 
         * @returns Array of legal moves
         */
        GetMoves(board) {

            //Moves calculated using o^(o-2r) trick. 
            //Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.

            let occupied = board.getOccupied();
            let rays = this.getSlidingRays();
            let position = this.position;
            let slidingMoves = 0n;

            rays.forEach(ray => {
                let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
                slidingMoves = slidingMoves | movesInRay.wholeRay;
            });
            return slidingMoves & ~board.getOccupied(this.color);
        }
    }

    class Rook extends SlidingPiece {

        GetType() {
            return E_PieceType.Rook;
        }

        getSlidingRays() {
            return [getFile(this.file), getRank(this.rank)];
        }

        GetMoves(board) {
            return super.GetMoves(board);
        }

        isOnInitialSquare() {
            return this.color === E_PieceColor.White ?
                (this.rank === 1 && this.file === 1) | (this.rank === 1 && this.file === 8) :
                (this.rank === 8 && this.file === 1) | (this.rank === 8 && this.file === 8);
        }
    }

    class Bishop extends SlidingPiece {


        GetType() {
            return E_PieceType.Bishop;
        }

        getSlidingRays() {
            return [getDiagonal(this.rank, this.file), getAntiDiagonal(this.rank, this.file)];
        }


        GetMoves(board) {
            return super.GetMoves(board);
        }
    }

    class Knight extends Piece {
        #attackMask = 0xA1100110An;

        GetType() {
            return E_PieceType.Knight;
        }
        /**
         * 
         * @param {BoardImplementation} board 
         * @returns 
         */
        GetMoves(board) {
            //calculate current square
            let currentSquare = (this.rank - 1) * NUMBER_OF_FILES + (NUMBER_OF_FILES - this.file + 1);
            let moves = 0n;

            //displace attack mask to current square
            if (19 <= currentSquare) {
                moves = this.#attackMask << BigInt(currentSquare - 19);
            } else {
                moves = this.#attackMask >> BigInt(19 - currentSquare);
            }

            //remove bits that "wrapped around" the sides
            if (this.file < 3) {
                moves = moves & ~getFile(7) & ~getFile(8);
            } else if (6 < this.file) {
                moves = moves & ~getFile(1) & ~getFile(2);
            }
            //remove pieces of same color
            moves = moves & ~board.getOccupied(this.color);

            return moves;
        }

        ToString() {
            return super.ToString().replace("K", "N");
        }
    }

    class Pawn extends Piece {
        GetType() {
            return E_PieceType.Pawn;
        }

        /**
         * 
         * @param {BoardImplementation} board 
         * @returns 
         */
        GetMoves(board) {
            let oneSquareFront;
            let twoSquaresFront;
            let rightDiagonalSquare;
            let leftDiagonalSquare;
            let targetRankForJumping;

            //****** transfer to data structure, use ? operator
            //calculate destination squares based on color 
            switch (this.color) {
                case E_PieceColor.White:
                    oneSquareFront = (this.position << 8n);
                    twoSquaresFront = (this.position << 16n);
                    rightDiagonalSquare = (this.position << 7n);
                    leftDiagonalSquare = (this.position << 9n);
                    targetRankForJumping = 4;
                    break;
                case E_PieceColor.Black:
                    oneSquareFront = (this.position >> 8n);
                    twoSquaresFront = (this.position >> 16n);
                    rightDiagonalSquare = (this.position >> 9n);
                    leftDiagonalSquare = (this.position >> 7n);
                    targetRankForJumping = 5;
                    break;
                case E_PieceColor.None:
                    throw new Error("No color specified");
                default:
                    throw new Error("No color specified");
            }

            //calculate front move
            let frontMove = oneSquareFront &
                board.getEmptySpaces(); //target square is empty

            //calculate front jump
            let frontJump = twoSquaresFront &
                getBooleanBitboard(frontMove > 1) & //a front move is possible
                board.getEmptySpaces() & //target square is empty 
                getRank(targetRankForJumping); //pawn can only jump from their initial rank

            //calculate capture moves
            let rightCapture = rightDiagonalSquare &
                board.getOccupied(OppositePieceColor(this.color)) & //There's an enemy piece in that square
                ~getFile(1); //remove right capture from 8th file to 1st file

            let leftCapture = leftDiagonalSquare &
                board.getOccupied(OppositePieceColor(this.color)) & //There's an enemy piece in that square
                ~getFile(8); //remove right capture from 1st file to 8th file

            return frontJump | frontMove | leftCapture | rightCapture;
        }

        GetCapturingSquares() {
            let rightDiagonalSquare;
            let leftDiagonalSquare;

            //****** transfer to data structure, use ? operator
            //calculate destination squares based on color 
            switch (this.color) {
                case E_PieceColor.White:
                    rightDiagonalSquare = (this.position << 7n);
                    leftDiagonalSquare = (this.position << 9n);
                    break;
                case E_PieceColor.Black:
                    rightDiagonalSquare = (this.position >> 9n);
                    leftDiagonalSquare = (this.position >> 7n);
                    break;
                default:
                    throw new Error("No color specified");
            }

            let rightCapture = rightDiagonalSquare &
                ~getFile(1); //remove right capture from 8th file to 1st file

            let leftCapture = leftDiagonalSquare &
                ~getFile(8); //remove right capture from 1st file to 8th file

            return rightCapture | leftCapture;
        }


        isBeforePromotingRank() {
            return this.rank === RANKS_TO_PROMOTE[this.color];
        }
    }

    class Queen extends SlidingPiece {

        GetType() {
            return E_PieceType.Queen;
        }

        getSlidingRays() {
            return [getRank(this.rank),
            getFile(this.file),
            getDiagonal(this.rank, this.file),
            getAntiDiagonal(this.rank, this.file)];
        }

        GetMoves(board) {
            return super.GetMoves(board);
        }
    }

    class King extends Piece {
        #attackMask = 0x70507n;

        GetType() {
            return E_PieceType.King;
        }
        /**
         * 
         * @param {BoardImplementation} board 
         * @returns 
         */
        GetMoves(board) {
            //calculate current square
            let currentSquare = (this.rank - 1) * 8 + (9 - this.file);
            let moves = 0n;

            //displace attack mask to current square
            if (10 <= currentSquare) {
                moves = this.#attackMask << BigInt(currentSquare - 10);
            } else {
                moves = this.#attackMask >> BigInt(10 - currentSquare);
            }

            //remove bits that "wrapped around" the sides
            if (this.file < 3) {
                moves = moves & ~getFile(7) & ~getFile(8);
            } else if (6 < this.file) {
                moves = moves & ~getFile(1) & ~getFile(2);
            }
            //remove pieces of same color
            moves = moves & ~board.getOccupied(this.color);

            return moves;
        }

        isOnInitialSquare() {
            return this.color === E_PieceColor.White ?
                (this.rank === 1 && this.file === 5) :
                (this.rank === 8 && this.file === 5);
        }
    }

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
                this.#piecesDictionary[color] = {};
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
         * @param {number} rank 
         * @param {number} file 
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
         * @param {number} rank 
         * @param {number} file 
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
         * @param {number} file 
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
         * @returns {bigint} Bitboard that contains pieces of given characteristics.
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
         * @param {E_CastlingSide} castlingSide 
         * @returns Whether the given side has rights to castle (It does not necesarilly mean castling is possible).
         */
        hasCastlingRights(color, castlingSide) {
            assertPieceColor(color);
            assert(castlingSide === E_CastlingSide.QueenSide || castlingSide === E_CastlingSide.KingSide, "Invalid castling side");

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

    class Castling extends Move {
        #castlingSide;
        constructor(startRank, startFile, destinationRank, destinationFile, castlingSide = E_CastlingSide.None) {
            assert(Object.values(E_CastlingSide).includes(castlingSide), "Invalid castling side");
            assert(castlingSide !== E_CastlingSide.None, "No castling side provided");
            super(startRank, startFile, destinationRank, destinationFile, E_MoveFlag.Castling);
            this.#castlingSide = castlingSide;
        }

        get castlingSide() {
            return this.#castlingSide;
        }
    }

    class Promotion extends Move {
        #newPieceType;
        constructor(startRank, startFile, destinationRank, destinationFile) {
            super(startRank, startFile, destinationRank, destinationFile, E_MoveFlag.Promotion);
            this.#newPieceType = E_PieceType.Queen;
        }

        get newPieceType() {
            assert(this.#newPieceType !== undefined, "No piece set for promotion");
            return this.#newPieceType;
        }

        set newPieceType(pieceType) {
            assertPieceType(pieceType);
            this.#newPieceType = pieceType;
        }
    }

    //****** CLASS PROLOG
    class MoveGenerator {
        /**
         * @param {BoardImplementation} board 
         * @param {E_PieceColor} pieceColor
         * @returns {Move[]} Array of legal moves of pieces of given color
         */
        generateMoves(board, pieceColor) {
            assert(board instanceof BoardImplementation, "Invalid board");
            assertPieceColor(pieceColor);

            let legalMoves = [];
            let playingPieces = board.getPiecesOfType(pieceColor, E_PieceType.Any);
            let enemyPieces = board.getPiecesOfType(OppositePieceColor(pieceColor), E_PieceType.Any);

            //calculate data to ensure king safety
            let king = board.getPiecesOfType(pieceColor, E_PieceType.King)[0];
            let targetSquaresToAvoidCheck = getBooleanBitboard(true);//squares to block check or capture checkers
            let moveFilterForPinnedPieces = {};//filter for moves of pinned pieces

            if (king !== undefined) {
                let checkers = this.#calculateCheckers(king, enemyPieces, board);
                let kingSafeMoves = this.#generateKingSafeMoves(king, enemyPieces, board);

                //if there's more than one checker
                if (1 < checkers.length) {
                    //the only possible moves are king moves
                    return kingSafeMoves;
                } //else if there is just 1 checker
                else if (checkers.length === 1) {
                    //calculate squares that can block the check or capture checker
                    targetSquaresToAvoidCheck = this.#calculateSquaresToAvoidCheck(king, checkers[0], board);
                }

                moveFilterForPinnedPieces = this.#calculatePinnedPieces(king, enemyPieces, board);
                legalMoves = legalMoves.concat(kingSafeMoves);
            }

            //calculate regular moves for each piece
            for (let piece of playingPieces) {
                //exclude calculation for king
                if (piece.GetType() === E_PieceType.King) continue;
                //get board with permitted moves
                let pieceMovesBitboard = piece.GetMoves(board);
                //filter moves if king is in check
                pieceMovesBitboard = pieceMovesBitboard & targetSquaresToAvoidCheck;
                //if piece is pinned, filter moves that do not discover a check
                let isPiecePinned = moveFilterForPinnedPieces[piece.position] !== undefined;
                if (isPiecePinned) {
                    let moveFilter = moveFilterForPinnedPieces[piece.position];
                    pieceMovesBitboard = pieceMovesBitboard & moveFilter;
                }

                //if a pawn is about to promote
                if (piece.GetType() === E_PieceType.Pawn && piece.isBeforePromotingRank()) {
                    //add promotion moves
                    let promotionsMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Promotion);
                    legalMoves = legalMoves.concat(promotionsMoves);
                }// else, add regular piece moves
                else {
                    let pieceMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Regular);
                    legalMoves = legalMoves.concat(pieceMoves);
                }
            }

            //generate enpassant move
            let pawns = board.getPiecesOfType(pieceColor, E_PieceType.Pawn);
            let enPassantMoves = this.#generateEnPassantMoves(pawns, board);
            legalMoves = legalMoves.concat(enPassantMoves);
            //generate castling moves
            let rooks = board.getPiecesOfType(pieceColor, E_PieceType.Rook);
            let castlingMoves = this.#generateCastlingMoves(king, rooks, board);
            legalMoves = legalMoves.concat(castlingMoves);

            return legalMoves;
        }

        /**
         * 
         * @param {King} king 
         * @param {Piece[]} enemyPieces 
         * @param {BoardImplementation} board 
         * @returns Array of pieces that check the king
         */
        #calculateCheckers(king, enemyPieces, board) {
            let checkers = [];
            for (let enemyPiece of enemyPieces) {
                let pieceChecksKing = (enemyPiece.GetMoves(board) & king.position) > 1n;
                if (pieceChecksKing) {
                    assert(enemyPiece.GetType() !== E_PieceType.King, "A king cannot check another king");
                    checkers.push(enemyPiece);
                }
            }
            return checkers;
        }

        /**
         * 
         * @param {King} king 
         * @param {bigint} protectedPieces 
         * @param {BoardImplementation} board 
         * @returns Array of moves the king can do safely
         */
        #generateKingSafeMoves(king, enemyPieces, board) {
            let dangerousSquaresForKing = 0n;
            board.removePiece(king.rank, king.file);//remove king temporarily to consider squares behind the king
            let squaresAttackedByEnemy = board.getAttackedSquares(OppositePieceColor(king.color));
            let dangerouseCaptures = this.#calculateProtectedPieces(enemyPieces, board);
            board.addPiece(king, king.rank, king.file);

            dangerousSquaresForKing = dangerouseCaptures | squaresAttackedByEnemy;

            let kingMovesBitboard = king.GetMoves(board) & ~dangerousSquaresForKing;
            return this.#bitboardToMoves(king, kingMovesBitboard, E_MoveFlag.Regular);
        }

        /**
         * 
         * @param {King} king 
         * @param {Piece[]} enemyPieces 
         * @param {BoardImplementation} board 
         * @returns Bitboard of enemy pieces that are protected (i.e the enemy can recapture if they are captured)
         */
        #calculateProtectedPieces(enemyPieces, board) { // ****** repeated code, transfer to piece?
            let protectedPieces = 0n;
            //for every enemy piece
            for (let enemyPiece of enemyPieces) {
                //if it is a slider
                if (enemyPiece.IsSlider()) {
                    let occupied = board.getOccupied();
                    let rays = enemyPiece.getSlidingRays();
                    let position = enemyPiece.position;
                    let slidingMoves = 0n;

                    rays.forEach(ray => {
                        let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
                        slidingMoves = slidingMoves | movesInRay.wholeRay;
                    });


                    protectedPieces |= slidingMoves & board.getOccupied(enemyPiece.color);

                } else if (enemyPiece.GetType() === E_PieceType.Pawn) {

                    let pawnCapturingSquares = enemyPiece.GetCapturingSquares();
                    protectedPieces |= pawnCapturingSquares & board.getOccupied(enemyPiece.color);

                } else if (enemyPiece.GetType() === E_PieceType.Knight | enemyPiece.GetType() === E_PieceType.King) {
                    let emptyBoard = new BoardImplementation('8/8/8/8/8/8/8/8');
                    let enemyMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                    protectedPieces |= enemyMovesInEmptyBoard & board.getOccupied(enemyPiece.color);
                }
            }

            return protectedPieces;

        }

        /**
         * 
         * @param {King} king 
         * @param {Piece} checker 
         * @returns Bitboard with squares pieces can move to in order to avoid the check
         */
        #calculateSquaresToAvoidCheck(king, checker) {
            //if checker is a slider
            if (checker.IsSlider()) {
                //We can block the check by moving to any square between the slider and the king or capturing the slider
                return getRay(checker.rank, checker.file, king.rank, king.file, true, false);
            } //if piece is not a slider
            else {
                //We can avoid the check only by capturing the checker
                return checker.position;
            }
        }

        /**
         * 
         * @param {King} king 
         * @param {Piece[]} enemyPieces 
         * @param {BoardImplementation} board 
         * @returns Object with pinned pieces and the filters for their moves
         */
        #calculatePinnedPieces(king, enemyPieces, board) {
            let moveFilterForPinnedPieces = {};
            //for every enemy piece
            for (let enemyPiece of enemyPieces) {
                //if it is not a slider, it cannot pin pieces
                if (!enemyPiece.IsSlider()) continue;

                let slider = enemyPiece;
                let sliderRays = slider.getSlidingRays();
                let rayFromSliderToKing = getRay(slider.rank, slider.file, king.rank, king.file, false, true);

                //if there's no possible ray between slider and king, king is not within slider's attack range, continue.
                if (rayFromSliderToKing === 0n) continue;

                //calculate if slider is allowed to move on the ray to the king
                let isSliderAllowedToMoveOnRay = false;
                for (let ray of sliderRays) {
                    if ((ray & rayFromSliderToKing) > 0n) {
                        isSliderAllowedToMoveOnRay = true;
                    }
                }
                //if slider is not allowed to move on the ray to the king, king is not within slider's attack range, do nothing. 
                if (!isSliderAllowedToMoveOnRay) continue;

                //check for pinned pieces
                //Taken from https://www.chessprogramming.org/Checks_and_Pinned_Pieces_(Bitboards)
                let attacksFromSliderToKing = hyperbolaQuintessenceAlgorithm(board.getOccupied(), slider.position, rayFromSliderToKing);
                let attacksFromKingToSlider = hyperbolaQuintessenceAlgorithm(board.getOccupied(), king.position, rayFromSliderToKing);
                let emptySpaceBetweenKingAndSlider = rayFromSliderToKing & ~king.position;
                let intersection = attacksFromKingToSlider.wholeRay & attacksFromSliderToKing.wholeRay;

                //if there's no intersection
                if (intersection === 0n) ; //else if the intersection is equal to empty spaces
                else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenKingAndSlider) ; else {
                    //There's one piece in between slider and king
                    //if the piece is an ally
                    let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                    if (isPieceAnAlly) {
                        //piece is being pinned by the slider.
                        //piece can only move in the ray from the slider to the king to avoid discovering a check
                        moveFilterForPinnedPieces[intersection] = rayFromSliderToKing | slider.position;
                    }
                }
            }
            return moveFilterForPinnedPieces;
        }

        /**
         * 
         * @param {Pawn[]} pawns 
         * @param {BoardImplementation} board 
         * @returns Array of en passant moves
         */
        #generateEnPassantMoves(pawns, board) {
            let enPassantMoves = [];
            let enPassantInfo = board.getEnPassantInfo();
            for (let pawn of pawns) {
                //The en passant capture must be performed on the turn immediately after the pawn being captured moves.
                if (enPassantInfo.rightToEnPassant === false) continue;

                //The capturing pawn must have advanced exactly three ranks to perform this move.
                if (pawn.rank !== ENPASSANT_CAPTURING_RANKS[pawn.color]) continue;

                //The captured pawn must be right next to the capturing pawn.
                let rankDiff = Math.abs(enPassantInfo.captureRank - pawn.rank);
                let fileDiff = Math.abs(enPassantInfo.captureFile - pawn.file);
                if (fileDiff !== 1 || rankDiff !== 0) continue;

                //You move your pawn diagonally to an adjacent square, one rank farther from where it had been, 
                //on the same file where the enemy's pawn is.
                let targetRank = pawn.color === E_PieceColor.White ? pawn.rank + 1 : pawn.rank - 1;
                let enPassant = new Move(pawn.rank, pawn.file, targetRank, enPassantInfo.captureFile, E_MoveFlag.EnPassant);
                //en passant move must be legal
                if (!this.#isEnPassantLegal(pawn.color, enPassant, board)) continue;

                enPassantMoves.push(enPassant);
            }
            return enPassantMoves;
        }

        /**
         * Checks if an en passant move is legal. Taken from: https://peterellisjones.com/posts/generating-legal-chess-moves-efficiently/
         * @param {E_PieceColor} playingColor 
         * @param {Move} enPassant 
         * @param {BoardImplementation} board 
         * @returns Whether the en passant move is legal
         */
        #isEnPassantLegal(playingColor, enPassant, board) {
            let capturedPawnRank = enPassant.startRank;
            let capturedPawnFile = enPassant.endFile;
            let capturingPawnRank = enPassant.startRank;
            let capturingPawnFile = enPassant.startFile;

            //check is king is currently in check
            let checkBeforeEnPassant = board.isKingInCheck(playingColor);

            //simulate making the en passant capture by removing both pieces
            let capturedPawn = board.removePiece(capturedPawnRank, capturedPawnFile);
            let capturingPawn = board.removePiece(capturingPawnRank, capturingPawnFile);

            //check if king is in check after making the en passant capture
            let checkAfterEnPassant = board.isKingInCheck(playingColor);

            //add removed pawns
            board.addPiece(capturedPawn, capturedPawnRank, capturedPawnFile);
            board.addPiece(capturingPawn, capturingPawnRank, capturingPawnFile);

            if (!checkBeforeEnPassant & !checkAfterEnPassant) {
                //en passant is legal
                return true;
            } else if (checkBeforeEnPassant && !checkAfterEnPassant) {
                //en passant blocks the check or captures pawn that was checking. Therefore, it is legal
                return true;
            } else if (!checkBeforeEnPassant & checkAfterEnPassant) {
                //en passant discovers a check. Therefore, it is illegal
                return false;
            } else if (checkBeforeEnPassant & checkAfterEnPassant) {
                //en passant discovered another check or enpassant move does not remove the check
                return false;
            }
        }

        /**
         * 
         * @param {King} king 
         * @param {Rook[]} rooks 
         * @param {BoardImplementation} board 
         * @returns Array of castling moves
         */
        #generateCastlingMoves(king, rooks, board) {
            //if there are no rooks or no king, castling is not possible
            if (king === undefined) return [];
            if (rooks === undefined || rooks.length === 0) return [];

            //The king cannot be in check
            if (board.isKingInCheck(king.color)) return [];

            let castlingMoves = [];
            for (let rook of rooks) {
                //if rook is not on its initial square, skip
                if (!rook.isOnInitialSquare()) continue;

                //This side must have castling rights. That is, rooks cannot have moved or been captured and king cannot have moved.
                let castlingSide = king.file > rook.file ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                if (!board.hasCastlingRights(rook.color, castlingSide)) continue;

                //There cannot be any piece between the rook and the king
                let castlingPath = castlingSide === E_CastlingSide.QueenSide ?
                    king.position << 1n | king.position << 2n | king.position << 3n :
                    king.position >> 1n | king.position >> 2n;

                let isCastlingPathObstructed = (board.getEmptySpaces() & castlingPath) !== castlingPath;

                //Your king can not pass through check
                let attackedSquares = board.getAttackedSquares(OppositePieceColor(king.color));
                let kingPathToCastle = castlingSide === E_CastlingSide.QueenSide ?
                    king.position << 1n | king.position << 2n :
                    king.position >> 1n | king.position >> 2n;

                let isKingPathChecked = (kingPathToCastle & attackedSquares) > 0n;

                if (!isCastlingPathObstructed && !isKingPathChecked) {
                    let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King].endFile;
                    let kingMove = new Castling(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
                    castlingMoves.push(kingMove);
                }
            }
            return castlingMoves;
        }


        /**
         * Converts a bitboard of moves into an array of moves with given flag
         * @param {Piece} piece 
         * @param {bigint} movesBitboard 
         * @param {E_MoveFlag} moveFlag 
         * @returns  Array of moves with given flag
         */
        #bitboardToMoves(piece, movesBitboard, moveFlag) {
            let moves = [];
            let testBit = 1n;

            if (movesBitboard === 0n) return [];
            //for each square
            for (let index = 0; index < 64; index++) {
                //if square is attacked by piece
                let squareAttacked = (movesBitboard & testBit) > 0n;
                if (squareAttacked) {
                    //calculate end rank and file
                    let endRank = Math.floor((index) / NUMBER_OF_FILES) + 1;
                    let endFile = NUMBER_OF_FILES - (index % NUMBER_OF_FILES);
                    //create move
                    let newMove;
                    if (moveFlag === E_MoveFlag.Promotion) {
                        newMove = new Promotion(piece.rank, piece.file, endRank, endFile);
                    } else {
                        newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                    }
                    //add move to array
                    moves.push(newMove);
                }

                //continue to next square
                testBit = testBit << 1n;
            }

            return moves;
        }
    }

    /* globals mouseX, mouseY */
    class MoveInput extends EventTarget {
        #inputListener;
        #board;

        #inputMoveStart = null;
        #inputMoveDestination = null;

        static inputEvents = {
            onMoveInput: "user:move-input",
            onSquareSelected: "user:square-selected",
            onMoveCanceled: "system:move-canceled",
            onMoveStartSet: "user:move-start-set",
            onMoveDestinationSet: "user:move-destination-set"
        }

        #enabled = true;
        get enabled() {
            return this.#enabled;
        }
        set enabled(enabled) {
            assert(typeof enabled === 'boolean', "enabled is not boolean");
            this.#enabled = enabled;
        }

        /**
         * @param {Board} board Board that Input should listen to
         * @param {number} globalBoardPositionX x position of board in canvas in pixels
         * @param {number} globalBoardPositionY y position of board in canvas in pixels
         */
        constructor(board, globalBoardPositionX, globalBoardPositionY) {
            assert(board instanceof Board, "Invalid board");
            assert(typeof globalBoardPositionX === 'number', "Invalid board x position");
            assert(typeof globalBoardPositionY === 'number', "Invalid board y position");

            super();

            this.#inputListener = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
            this.#board = board;

            //listen to click events on main canvas
            select('canvas').mouseClicked(() => {
                this.#handleClick(mouseX, mouseY, globalBoardPositionX, globalBoardPositionY);
            });
        }

        addInputEventListener(event, callback) {
            assert(Object.values(MoveInput.inputEvents).includes(event), "Invalid event");
            this.addEventListener(event, callback);
        }

        #handleClick(clickX, clickY, boardPositionX, boardPositionY) {
            if (!this.#enabled) return;
            //get click coordinates relative to page
            let xCoordinate = clickX;
            let yCoordinate = clickY;
            //get clicked square

            let clickedRank = 8 - this.#inputListener.screenRow(yCoordinate, boardPositionY, BOARD_UI_SETTINGS.SQUARE_SIZE);
            let clickedFile = this.#inputListener.screenCol(xCoordinate, boardPositionX, BOARD_UI_SETTINGS.SQUARE_SIZE) + 1;
            let clickedSquare = {
                rank: clickedRank,
                file: clickedFile
            };

            //if click is not within board limits
            let isClickWithinBoardLimits = 1 <= clickedRank && clickedRank <= NUMBER_OF_RANKS && 1 <= clickedFile && clickedFile <= NUMBER_OF_FILES;
            if (!isClickWithinBoardLimits) {
                //if move was started
                if (this.#inputMoveStart !== null) {
                    //cancel it
                    this.#CancelMove();
                }
                return;
            }

            //notify that a square was selected
            let squareSelectedEvent = new CustomEvent(MoveInput.inputEvents.onSquareSelected, { detail: { square: clickedSquare } });
            this.dispatchEvent(squareSelectedEvent);

            //if move start is not set and there's a piece in selected square
            let pieceInClickedSquare = this.#board.getPieceOnRankFile(clickedRank, clickedFile) !== null;
            if (this.#inputMoveStart === null && pieceInClickedSquare) {

                //set this square as the move start
                this.#inputMoveStart = {
                    rank: clickedRank,
                    file: clickedFile
                };

                //notify
                let moveStartSetEvent = new CustomEvent(MoveInput.inputEvents.onMoveStartSet, { detail: { square: clickedSquare } });
                this.dispatchEvent(moveStartSetEvent);
            }
            //else if move start is set and destination is not
            else if (this.#inputMoveStart !== null && this.#inputMoveDestination === null) {
                //if start square and destination square are the same
                if ((this.#inputMoveStart.rank === clickedRank && this.#inputMoveStart.file === clickedFile)) {
                    //cancel move
                    this.#CancelMove();
                    return;
                }

                //set this square as the move destination
                this.#inputMoveDestination = {
                    rank: clickedRank,
                    file: clickedFile
                };
                //notify
                let moveDestinationSet = new CustomEvent(MoveInput.inputEvents.onMoveDestinationSet, { detail: { square: clickedSquare } });
                this.dispatchEvent(moveDestinationSet);

                //create move
                let inputMove = new Move(this.#inputMoveStart.rank, this.#inputMoveStart.file, this.#inputMoveDestination.rank, this.#inputMoveDestination.file);
                //notify
                let moveInput = new CustomEvent(MoveInput.inputEvents.onMoveInput, { detail: { move: inputMove } });
                this.dispatchEvent(moveInput);
                //unset start and destination
                this.#inputMoveStart = null;
                this.#inputMoveDestination = null;
            }
        }

        #CancelMove() {
            this.#inputMoveStart = null;
            this.#inputMoveDestination = null;
            let moveCanceled = new CustomEvent(MoveInput.inputEvents.onMoveCanceled);
            this.dispatchEvent(moveCanceled);
        }

        static #pieceSelectedForPromotion = E_PieceType.Queen;

        static get pieceSelectedForPromotion() {
            return this.#pieceSelectedForPromotion;
        }

        static set pieceSelectedForPromotion(value) {
            assertPieceType(value);
            assert(value !== E_PieceType.Pawn, "Promotion to Pawn is forbidden");
            assert(value !== E_PieceType.King, "Promotion to King is forbidden");
            this.#pieceSelectedForPromotion = value;
        }
    }

    /* globals CENTER */

    //******  CLASS PROLOG, ASSERT AND DOCUMENT PRIVATE METHODS
    class Board {
        #moveGenerator;
        #boardImplementation;

        #board = new Quadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS); //board with pieces in symbol representation
        #boardBackground;

        #boardChanges = [];
        #E_BoardChangeType = Object.freeze({
            Addition: Symbol("Addition"),
            Removal: Symbol("Removal"),
            CastlingRigthsChange: Symbol("CastlingRigthsChange"),
            EnPassantUpdate: Symbol("EnPassantUpdate"),
            Capture: Symbol("Capture")
        })

        #castlingRights = {
            [E_PieceColor.White]: {
                [E_CastlingSide.KingSide]: false,
                [E_CastlingSide.QueenSide]: false
            }, [E_PieceColor.Black]: {
                [E_CastlingSide.KingSide]: false,
                [E_CastlingSide.QueenSide]: false
            }
        }

        #enPassantInfo = {
            rightToEnPassant: false,
            captureRank: null,
            captureFile: null
        }

        #capturedPieces = {
            [E_PieceColor.White]: "",
            [E_PieceColor.Black]: ""
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
            this.#board = new Quadrille(inputFen);

            //calculate castling rights
            //for each color
            for (let color of Object.values(E_PieceColor)) {
                if (color === E_PieceColor.None || color === E_PieceColor.Any) continue;

                let kingKey = pieceColorTypeToKey(color, E_PieceType.King);
                let kingSymbol = Quadrille.chessSymbols[kingKey];
                let kingPos = this.#board.search(createQuadrille([kingSymbol]), true)[0];
                //if board has no king or king has moved from initial square
                if (kingPos === undefined) {
                    //no castling is possible
                    this.#setCastlingRights(color, E_CastlingSide.KingSide, false);
                    this.#setCastlingRights(color, E_CastlingSide.QueenSide, false);
                    continue;

                } else { //else if there's a king
                    let rank = NUMBER_OF_RANKS - kingPos.row;
                    let file = kingPos.col + 1;
                    let isKingOnInitialSquare = color === E_PieceColor.White ?
                        (rank === 1 && file === 5) :
                        (rank === 8 && file === 5);
                    //if king is not in its initial square
                    if (!isKingOnInitialSquare) {
                        //no castling is possible
                        this.#setCastlingRights(color, E_CastlingSide.KingSide, false);
                        this.#setCastlingRights(color, E_CastlingSide.QueenSide, false);
                        continue;
                    }
                }

                let rookKey = pieceColorTypeToKey(color, E_PieceType.Rook);
                let rookSymbol = Quadrille.chessSymbols[rookKey];
                let rookPositions = this.#board.search(createQuadrille([rookSymbol]), true);
                for (let rookPosition of rookPositions) {

                    let rank = NUMBER_OF_RANKS - rookPosition.row;
                    let file = rookPosition.col + 1;
                    let isRookOnInitialSquare = color === E_PieceColor.White ?
                        (rank === 1 && file === 1) || (rank === 1 && file === 8) :
                        (rank === 8 && file === 1) || (rank === 8 && file === 8);

                    if (isRookOnInitialSquare) {
                        let castlingSide = file === 1 ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                        this.#setCastlingRights(color, castlingSide, true);
                    }
                }
            }

            //initialize board implementation
            this.#boardImplementation = new BoardImplementation(inputFen, this.#castlingRights, this.#enPassantInfo);

            Quadrille.whiteSquare = BOARD_UI_SETTINGS.WHITE_SQUARE_COLOR;
            Quadrille.blackSquare = BOARD_UI_SETTINGS.BLACK_SQUARE_COLOR;
            this.#boardBackground = new Quadrille();

        }


        /**
         * @param {E_PieceColor} pieceColor
         * @return {Move[]} Array of legal moves of pieces of given color
         */
        generateMoves(pieceColor) {
            assertPieceColor(pieceColor);
            return this.#moveGenerator.generateMoves(this.#boardImplementation, pieceColor);
        }

        /**
         * Applies move to board
         * @param {Move} move 
         */
        makeMove(move) {
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
                    case E_MoveFlag.Castling:
                        this.#makeCastlingMove(move);
                        break;
                    case E_MoveFlag.EnPassant:
                        this.#makeEnPassantMove(move);
                        break;
                    default:
                        throw new Error("Failed making move. Move has no valid flag");
                }
                this.#boardImplementation = new BoardImplementation(this.getFen(), this.#castlingRights, this.#enPassantInfo);
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
            //get last board changes 
            let lastChanges = this.#popBoardChanges();
            //if no changes, do nothing
            if (lastChanges === undefined) return;

            let numberOfChanges = lastChanges.length;
            try {
                //for each change
                for (let i = 0; i < numberOfChanges; i++) {
                    let change = lastChanges.pop();
                    //undo change
                    switch (change.type) {
                        case this.#E_BoardChangeType.Addition:
                            this.#removePiece(change.rank, change.file, false);
                            break;
                        case this.#E_BoardChangeType.Removal:
                            this.#addPiece(change.piece, change.rank, change.file, false);
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
                        case this.#E_BoardChangeType.Capture:
                            this.#capturedPieces[E_PieceColor.White] = this.#capturedPieces[E_PieceColor.White].replace(change.piece, "");
                            this.#capturedPieces[E_PieceColor.Black] = this.#capturedPieces[E_PieceColor.Black].replace(change.piece, "");
                            this.#addPiece(change.piece, change.rank, change.file, false);
                            break;
                        default:
                            throw new Error("Invalid board change");
                    }
                }
                this.#boardImplementation = new BoardImplementation(this.getFen(), this.#castlingRights, this.#enPassantInfo);
            } catch (error) {
                console.log(lastChanges);
                throw error;
            }

        }
        /**
         * 
         * @returns FEN string of current board state
         */
        getFen() {
            return this.#board.toFEN();
        }

        /**
         * 
         * @param {number} rank 
         * @param {number} file 
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
         * @returns String with all pieces of given color that have been captured
         */
        getCapturedPieces(pieceColor) {
            assertPieceColor(pieceColor);
            return this.#capturedPieces[pieceColor];
        }

        /**
         * 
         * @param {E_PieceColor} kingColor 
         * @returns Whether the king of given color is being checked or not
         */
        isKingInCheck(kingColor) {
            assertPieceColor(kingColor);
            return this.#boardImplementation.isKingInCheck(kingColor);
        }

        /**
         * Draws board
         */
        draw(graphics) {
            graphics.drawQuadrille(this.#boardBackground, { x: BOARD_UI_SETTINGS.LOCAL_POSITION.x, y: BOARD_UI_SETTINGS.LOCAL_POSITION.y, cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE });
            graphics.drawQuadrille(this.#board, {
                x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                y: BOARD_UI_SETTINGS.LOCAL_POSITION.y,
                cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE,
                outline: color(BOARD_UI_SETTINGS.OUTLINE),
                stringDisplay: ({ graphics, value, cellLength = Quadrille.cellLength } = {}) => {
                    graphics.textAlign(CENTER, CENTER);
                    graphics.textSize(BOARD_UI_SETTINGS.PIECES_SIZE);
                    graphics.fill(color(BOARD_UI_SETTINGS.PIECES_COLOR));
                    graphics.text(value, cellLength / 2, cellLength / 2);
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
                let pieceSymbol = this.#board.read(row, col);
                if (pieceSymbol === null) {
                    string += " #";
                } else {
                    string += " " + Quadrille.chessKeys[pieceSymbol];
                }

                if (((col + 1) % NUMBER_OF_FILES) === 0) {
                    string += "\n";
                }
            });

            console.log(string);
        }



        /**
         * Adds a piece to given rank and file
         * @param {string} pieceSymbol 
         * @param {number} rank 
         * @param {number} file 
         */
        #addPiece(pieceSymbol, rank, file, recordChange = true) {
            assert(Object.values(Quadrille.chessSymbols).includes(pieceSymbol));
            assertRank(rank);
            assertRank(file);

            if (this.getPieceOnRankFile(rank, file) !== null) {
                throw new Error("Cannot add piece in a occupied square");
            }

            let rankIndex = NUMBER_OF_RANKS - rank;
            let fileIndex = file - 1;
            this.#board.fill(rankIndex, fileIndex, pieceSymbol);

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
         * @param {number} rank 
         * @param {number} file 
         * @param {boolean} recordChange record removal so it can be undone?
         * @returns 
         */
        #removePiece(rank, file, recordChange = true) {
            assertRank(rank);
            assertRank(file);

            let pieceToRemove = this.getPieceOnRankFile(rank, file);

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

            let rankIndex = NUMBER_OF_RANKS - rank;
            let fileIndex = file - 1;
            this.#board.clear(rankIndex, fileIndex);

            return pieceToRemove;
        }


        #makeRegularMove(move) {
            //if there's a piece in destination
            let pieceInDestination = this.getPieceOnRankFile(move.endRank, move.endFile);
            if (pieceInDestination !== null) {
                assert(pieceInDestination.toLowerCase() !== 'k', "King capture is forbidden");
                //capture it
                this.#capturePiece(move.endRank, move.endFile);
            }

            //move piece
            let pieceToMove = this.getPieceOnRankFile(move.startRank, move.startFile);
            this.#removePiece(move.startRank, move.startFile);
            this.#addPiece(pieceToMove, move.endRank, move.endFile);
        }

        #makePromotionMove(move) {
            //move pawn
            this.#makeRegularMove(move);
            //remove pawn
            let pawn = this.#removePiece(move.endRank, move.endFile);
            //get new piece characteristics
            let pawnKey = Quadrille.chessKeys[pawn];
            let newPieceType = move.newPieceType;
            let pieceColor = pieceKeyToColor(pawnKey);
            //create piece symbol
            let pieceKey = pieceColorTypeToKey(pieceColor, newPieceType);
            let pieceSymbol = Quadrille.chessSymbols[pieceKey];
            //add promoted piece
            this.#addPiece(pieceSymbol, move.endRank, move.endFile);
        }

        #makeCastlingMove(move) {
            //move  king
            this.#makeRegularMove(move);
            //move rook
            let rookMove = new Move(
                move.startRank,
                CASTLING_FILES[move.castlingSide][E_PieceType.Rook].startFile,
                move.startRank,
                CASTLING_FILES[move.castlingSide][E_PieceType.Rook].endFile,
                E_MoveFlag.Regular
            );
            this.#makeRegularMove(rookMove);
        }

        #makeEnPassantMove(move) {
            //move capturing pawn
            this.#makeRegularMove(move);
            //capture target pawn
            this.#capturePiece(move.startRank, move.endFile);
        }

        #capturePiece(rank, file) {
            //add piece to captured pieces
            let pieceSymbol = this.getPieceOnRankFile(rank, file);
            let pieceColor = pieceKeyToColor(Quadrille.chessKeys[pieceSymbol]);
            this.#capturedPieces[pieceColor] += pieceSymbol;
            //remove from board
            this.#removePiece(rank, file, false);
            let capture = { type: this.#E_BoardChangeType.Capture, rank: rank, file: file, piece: pieceSymbol };
            this.#pushBoardChange(capture);
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


        /**
         * 
         * @param {Move} move 
         */
        #updateCastlingRights(move) {
            let pieceInStart = this.#boardImplementation.getPieceOnRankFile(move.startRank, move.startFile);
            let pieceInDestination = this.#boardImplementation.getPieceOnRankFile(move.endRank, move.endFile);

            //if it is a castling move
            let isCastlingMove = move.flag === E_MoveFlag.Castling;
            if (isCastlingMove) {

                //remove castling rights from both sides
                let king = pieceInStart;
                let castlingSide = move.castlingSide;
                let oppositeCastlingSide = castlingSide === E_CastlingSide.KingSide ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                this.#disableCastlingRights(king.color, castlingSide);
                this.#disableCastlingRights(king.color, oppositeCastlingSide);

            } else {

                //if a rook is moving
                if (pieceInStart.GetType() === E_PieceType.Rook) {
                    let rook = pieceInStart;
                    let rookCastlingSide = rook.file === 1 ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;

                    //if the rook that's moving is on its initial corner and hasn't moved
                    if (rook.isOnInitialSquare() && this.#hasCastlingRights(rook.color, rookCastlingSide)) {
                        //Remove castling rights from this rook's side
                        this.#disableCastlingRights(rook.color, rookCastlingSide);
                    }
                } //else if a king is moving
                else if (pieceInStart.GetType() === E_PieceType.King) {
                    let king = pieceInStart;
                    //if the king has not moved before
                    let hasKingMoved = !(king.isOnInitialSquare() &&
                        this.#hasCastlingRights(king.color, E_CastlingSide.KingSide) &&
                        this.#hasCastlingRights(king.color, E_CastlingSide.QueenSide));
                    if (!hasKingMoved) {
                        //remove castling rights from both sides
                        this.#disableCastlingRights(king.color, E_CastlingSide.KingSide);
                        this.#disableCastlingRights(king.color, E_CastlingSide.QueenSide);
                    }
                }

                //if a rook is captured
                if (pieceInDestination !== null && pieceInDestination.GetType() === E_PieceType.Rook) {
                    let rook = pieceInDestination;
                    let rookCastlingSide = rook.file === 1 ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;

                    //if the rook that's being captured is on its initial corner  and hasn't moved
                    if (rook.isOnInitialSquare() && this.#hasCastlingRights(rook.color, rookCastlingSide)) {
                        //remove castling rights from the captured rook's side
                        this.#disableCastlingRights(rook.color, rookCastlingSide);
                    }
                }
            }
        }

        /**
         * 
         * @param {E_PieceColor} color 
         * @param {E_CastlingSide} castlingSide 
         * @returns Whether the given side has rights to castle (It does not necesarilly mean castling is possible).
         */
        #hasCastlingRights(color, castlingSide) {
            assertPieceColor(color);
            assert(Object.values(E_CastlingSide).includes(castlingSide), "Invalid castling side");

            return this.#castlingRights[color][castlingSide];
        }

        #setCastlingRights(color, castlingSide, enabled) {
            assert(Object.values(E_CastlingSide).includes(castlingSide), "Invalid castling side");
            this.#castlingRights[color][castlingSide] = enabled;
        }

        #disableCastlingRights(color, castlingSide) {
            if (this.#hasCastlingRights(color, castlingSide)) {
                this.#castlingRights[color][castlingSide] = false;
                //record change
                let disableCastlingRights = {
                    type: this.#E_BoardChangeType.CastlingRigthsChange,
                    color: color,
                    castlingSide: castlingSide
                };
                this.#pushBoardChange(disableCastlingRights);
            }
        }

        #updateEnPassantInfo(move) {
            let pieceInStart = this.#boardImplementation.getPieceOnRankFile(move.startRank, move.startFile);
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
                };
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
                };
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

    class MoveRecord extends EventTarget {
        static events = {
            onMoveRecorded: "system:move-recorded",
            onMoveUnrecorded: "system:move-recorded"
        }

        #record = [];
        /**
         * Records given move. Move must not have been made in the board.
         * @param {Move} move 
         * @param {Board} board Board in which given move is performed
         * @param {E_PieceColor} playingColor Color that performs given move
         */
        recordMove(move, board, playingColor) {
            //test: Basis and data-flow testing with several games

            let moveString = "";
            //if it is a castling move
            if (move.flag === E_MoveFlag.Castling) {
                //add castling mark
                moveString = move.castlingSide === E_CastlingSide.KingSide ? "0-0" : "0-0-0";
                //notify
                let onMoveRecorded = new CustomEvent(MoveRecord.events.onMoveRecorded, { detail: { move: moveString } });
                this.dispatchEvent(onMoveRecorded);
                //add move to record
                this.#record.push(moveString);
                //no other marks are needed, return
                return moveString;
            }

            let pieceInStart = board.getPieceOnRankFile(move.startRank, move.startFile);
            let isCapturingMove = board.getPieceOnRankFile(move.endRank, move.endFile) !== null || move.flag === E_MoveFlag.EnPassant;

            //add piece abbreviation
            //if piece in start is a pawn
            let isPawn = (pieceInStart === Quadrille.chessSymbols['P']) || (pieceInStart === Quadrille.chessSymbols['p']);
            if (isPawn) {
                //add departure file if it is a capturing move
                if (isCapturingMove) moveString += FileToLetter(move.startFile);
            } else {
                //add piece abbreviation
                moveString += pieceInStart;
            }

            //if piece is not a pawn
            if (!isPawn) {
                //check if departure rank or file is ambiguous and disambiguate 
                moveString += this.#calculateMoveDisambiguation(board, playingColor, move, pieceInStart, moveString);
            }

            //if move is a capture
            if (isCapturingMove) {
                //add capture mark
                moveString += 'x';
            }

            //add destination square
            let rank = move.endRank.toString();
            let file = FileToLetter(move.endFile);
            let destination = file + rank;
            moveString += destination;

            //add special moves marks
            switch (move.flag) {
                case E_MoveFlag.EnPassant:
                    moveString += 'e.p';
                    break;
                case E_MoveFlag.Promotion:
                    moveString += '=' + pieceColorTypeToKey(playingColor, move.newPieceType);
                    break;
            }

            //add check or checkmate marks
            board.makeMove(move);
            let enemyColor = OppositePieceColor(playingColor);
            let enemyLegalMoves = board.generateMoves(enemyColor);
            let isEnemyKingInCheck = board.isKingInCheck(enemyColor);
            //if it is a checkmate
            if (enemyLegalMoves.length === 0 && isEnemyKingInCheck) {
                //add checkmate mark
                moveString += '#';
            }//else if it is a check
            else if (enemyLegalMoves.length !== 0 && isEnemyKingInCheck) {
                //add check mark
                moveString += '+';
            }
            board.unmakeMove();

            //notify
            let onMoveRecorded = new CustomEvent(MoveRecord.events.onMoveRecorded, { detail: { move: moveString } });
            this.dispatchEvent(onMoveRecorded);
            //add move to record
            this.#record.push(moveString);
            return moveString;
        }

        #calculateMoveDisambiguation(board, playingColor, moveToRecord, pieceToMove) {
            let disambiguation = '';
            let piecesInSameRank = false;
            let piecesInSameFile = false;
            let ambiguityExists = false;

            //for every legal move  
            let legalMoves = board.generateMoves(playingColor);
            for (let otherMove of legalMoves) {
                //except the current one 
                if (moveToRecord.startRank === otherMove.startRank && moveToRecord.startFile === otherMove.startFile) continue;

                let otherPiece = board.getPieceOnRankFile(otherMove.startRank, otherMove.startFile);
                //if pieces are the same and they have the same destination square
                let isSamePiece = pieceToMove === otherPiece;
                let otherMoveHasSameDestination = (otherMove.endRank === moveToRecord.endRank) && (otherMove.endFile === moveToRecord.endFile);
                if (isSamePiece && otherMoveHasSameDestination) {
                    //There's an ambiguity!
                    ambiguityExists = true;
                    //if files are the same 
                    if (moveToRecord.startFile === otherMove.startFile) {
                        //rank is ambiguous
                        piecesInSameFile = true;
                    }

                    //if ranks are the same
                    if (moveToRecord.startRank === otherMove.startRank) {
                        //file is ambiguous
                        piecesInSameRank = true;
                    }

                }
            }

            //add disambiguation
            //if there's an ambiguity but pieces are in different rank and file, resolve by adding the file
            if (ambiguityExists && !piecesInSameFile && !piecesInSameRank) disambiguation += FileToLetter(moveToRecord.startFile);
            else {
                //if there's an ambiguity and there are pieces in the same rank, resolve by adding the file
                if (ambiguityExists && piecesInSameRank) disambiguation += FileToLetter(moveToRecord.startFile);
                //if there's an ambiguity and there are pieces in the same file, resolve by adding the rank
                if (ambiguityExists && piecesInSameFile) disambiguation += moveToRecord.startRank;
            }

            return disambiguation;
        }

        /**
         * Delete last move recorded.
         */
        unrecordMove() {
            this.#record.pop();
            let onMoveUnrecorded = new CustomEvent(MoveRecord.events.onMoveRecorded);
            this.dispatchEvent(onMoveUnrecorded);
        }
        /**
         * 
         * @returns Record of moves
         */
        getRecord() {
            return [...this.#record];
        }
    }

    class MoveInputUI {
        #game;
        #UIQuadrille;
        #colorForSelectedSquare;
        #colorForAvailableMoves;
        #moveCompleted = false;

        /**
         * 
         * @param {Game} game 
         * @param {MoveInput} moveInput 
         */
        constructor(game, moveInput) {
            assert(game instanceof Game, "Invalid Game");
            assert(moveInput instanceof MoveInput, "Invalid Move Input");

            this.#game = game;
            this.#UIQuadrille = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
            moveInput.addInputEventListener(MoveInput.inputEvents.onMoveStartSet, this.#onMoveStartSet.bind(this));
            moveInput.addInputEventListener(MoveInput.inputEvents.onMoveDestinationSet, this.#onMoveDestinationSet.bind(this));
            moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));
            moveInput.addInputEventListener(MoveInput.inputEvents.onMoveCanceled, this.#onMoveCanceled.bind(this));

            this.#colorForSelectedSquare = color(MOVE_INPUT_UI_SETTINGS.COLOR_FOR_SELECTED_SQUARES);
            this.#colorForAvailableMoves = color(MOVE_INPUT_UI_SETTINGS.COLOR_FOR_AVAILABLE_MOVES);
        }

        #onMoveStartSet(event) {
            //if a move was just completed
            if (this.#moveCompleted) {
                //clar UI
                this.#Clear();
                this.#moveCompleted = false;
            }
            let square = event.detail.square;
            //fill selected square
            this.#fillSquare(square.rank, square.file, this.#colorForSelectedSquare);
            //draw available moves
            for (let move of this.#game.legalMoves) {
                if (move.startRank === square.rank && move.startFile === square.file) {
                    this.#fillSquare(move.endRank, move.endFile, this.#colorForAvailableMoves);
                }
            }
        }

        #onMoveDestinationSet(event) {
            //fill selected square
            this.#fillSquare(event.detail.square.rank, event.detail.square.file, this.#colorForSelectedSquare);
        }

        #fillSquare(rank, file, color) {
            let row = 8 - rank;
            let column = file - 1;
            this.#UIQuadrille.fill(row, column, color);
        }

        #onMoveInput(event) {
            let result = this.#game.isMoveLegal(event.detail.move);
            //if input move is not legal
            if (!result.isLegal) {
                //clear UI
                this.#Clear();
            } else {
                //hide available moves
                this.#UIQuadrille.replace(this.#colorForAvailableMoves, null);
            }
            this.#moveCompleted = true;
        }

        #onMoveCanceled(event) {
            this.#Clear();
        }

        #Clear() {
            this.#UIQuadrille.clear();
        }

        draw(graphics) {
            graphics.drawQuadrille(this.#UIQuadrille,
                {
                    x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                    y: BOARD_UI_SETTINGS.LOCAL_POSITION.y,
                    cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE,
                    outlineWeight: 0
                });
        }
    }

    class MoveRecordUI {
        #table;

        #currentColumnIndex = 1;
        #firstVisibleRow = 1;
        get #lastRowIndex() {
            return this.#table.height - 1;
        }
        get #lastVisibleRow() {
            return this.#firstVisibleRow + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE - 1;
        }
        get #lastRowNumber() {
            return this.#table.height;
        }

        #upButton;
        #downButton;

        constructor(moveRecord) {
            assert(moveRecord instanceof MoveRecord, "Invalid Move Record");

            moveRecord.addEventListener(MoveRecord.events.onMoveRecorded, this.#onMoveRecorded.bind(this));
            moveRecord.addEventListener(MoveRecord.events.onMoveUnrecorded, this.#onMoveUnrecorded.bind(this));

            this.#table = createQuadrille(3, 1);
            this.#table.fill(0, 0, 1);


            this.#upButton = createButton("Up");
            this.#upButton.mouseClicked(() => {
                this.#firstVisibleRow--;
                this.#updateButtons();
            });
            this.#upButton.size(MOVE_RECORD_UI_SETTINGS.BUTTON_WIDTH, MOVE_RECORD_UI_SETTINGS.BUTTON_HEIGHT);
            this.#upButton.hide();

            this.#downButton = createButton("Down");
            this.#downButton.mouseClicked(() => {
                this.#firstVisibleRow++;
                this.#updateButtons();
            });
            this.#downButton.size(MOVE_RECORD_UI_SETTINGS.BUTTON_WIDTH, MOVE_RECORD_UI_SETTINGS.BUTTON_HEIGHT);
            this.#downButton.hide();
        }

        #onMoveRecorded(event) {
            let move = event.detail.move;
            this.#addNewEntry(move);
        }

        #onMoveUnrecorded(event) {

        }

        #addNewEntry(move) {
            //if row is filled
            if (this.#isRowFill()) {
                //add new row
                this.#addNewRow();
                //fill first column
                this.#table.fill(this.#lastRowIndex, 0, this.#lastRowNumber);
                this.#currentColumnIndex = 1;
            }

            //fill move
            this.#table.fill(this.#lastRowIndex, this.#currentColumnIndex, move);
            this.#currentColumnIndex++;
            this.#updateButtons();
        }


        #isRowFill() {
            let columnNumber = this.#currentColumnIndex + 1;
            return 3 < columnNumber;
        }

        #addNewRow() {
            this.#table.insert(this.#table.height);
            if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#lastRowNumber) {
                this.#firstVisibleRow = this.#lastRowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE;
            }
        }

        #updateButtons() {
            //if table has not overflown
            if (this.#firstVisibleRow < 2 && this.#table.height < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
                this.#upButton.hide();
                this.#downButton.hide();
            } //else if user is at the top of the table
            else if (this.#firstVisibleRow < 2 && MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
                this.#upButton.hide();
                this.#downButton.show();
            } //else if user is at the middle of the table
            else if (2 <= this.#firstVisibleRow && this.#lastVisibleRow < this.#table.height) {
                this.#upButton.show();
                this.#downButton.show();
            } //else  user is at the bottom of the table
            else {
                this.#upButton.show();
                this.#downButton.hide();
            }
        }

        draw(graphics, graphicsX, graphicsY) {
            //if there's no entries, do not draw
            if (this.#lastRowIndex === 0 && this.#table.isEmpty(0, 1)) return;

            //if table is overflowing, extract visible rows
            let tableToDraw = this.#table;
            if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
                tableToDraw = this.#table.row(this.#firstVisibleRow - 1);
                for (let i = 1; i < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE; i++) {
                    let rowIndex = this.#firstVisibleRow - 1 + i;
                    tableToDraw = Quadrille.or(tableToDraw, this.#table.row(rowIndex), i);
                }
            }

            graphics.drawQuadrille(tableToDraw, {
                x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
                y: MOVE_RECORD_UI_SETTINGS.POSITION.y,
                cellLength: MOVE_RECORD_UI_SETTINGS.CELL_LENGTH,
                textZoom: 1,
                numberDisplay: ({ graphics, value, cellLength = this.#table.cellLength } = {}) => {
                    graphics.fill(color(0));
                    graphics.textAlign(CENTER, CENTER);
                    graphics.textSize(cellLength * Quadrille.textZoom * 0.8);
                    graphics.text(value, cellLength / 2, cellLength / 2);
                },
            });

            this.#upButton.position(
                graphicsX + MOVE_RECORD_UI_SETTINGS.POSITION.x + MOVE_RECORD_UI_SETTINGS.TABLE_WIDTH + MOVE_RECORD_UI_SETTINGS.BUTTON_SPACE_FROM_TABLE,
                graphicsY + MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.TABLE_HEIGHT / 2 - 25
            );
            this.#downButton.position(
                graphicsX + MOVE_RECORD_UI_SETTINGS.POSITION.x + MOVE_RECORD_UI_SETTINGS.TABLE_WIDTH + MOVE_RECORD_UI_SETTINGS.BUTTON_SPACE_FROM_TABLE,
                graphicsY + MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.TABLE_HEIGHT / 2 + 25
            );
        }
    }

    class PiecesCapturedUI {
        #board;

        constructor(board) {
            assert(board instanceof Board, "Invalid board");
            this.#board = board;
        }

        draw(graphics) {
            graphics.textSize(PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE);
            graphics.fill(color(0));
            graphics.textAlign(LEFT, TOP);

            graphics.text(this.#board.getCapturedPieces(E_PieceColor.White),
                PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.x,
                PIECES_CAPTURED_UI_SETTINGS.WHITE_PIECES_POSITION.y);

            graphics.text(this.#board.getCapturedPieces(E_PieceColor.Black),
                PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.x,
                PIECES_CAPTURED_UI_SETTINGS.BLACK_PIECES_POSITION.y);

            graphics.textAlign(LEFT, BOTTOM);
        }
    }

    /*globals BOLD, NORMAL, LEFT, BOTTOM, CENTER, TOP */
    //assert, document
    class GameStateUI {
        #game;

        /**
         * 
         * @param {Game} game 
         */
        constructor(game) {
            this.#game = game;
        }

        draw(graphics) {
            let rectFillTargetColour;
            let textColor;
            let message;

            let gameState = this.#game.state;
            let playingColor = this.#game.playingColor;

            switch (gameState) {
                case E_GameState.PLAYING:
                    rectFillTargetColour = playingColor === E_PieceColor.White ? color(255) : color(0);
                    textColor = playingColor === E_PieceColor.White ? color(0) : color(255);
                    message = playingColor === E_PieceColor.White ? "White Moves" : "Black Moves";
                    break;
                case E_GameState.CHECKMATE:
                    rectFillTargetColour = OppositePieceColor(playingColor) === E_PieceColor.White ? color(255) : color(0);
                    textColor = OppositePieceColor(playingColor) === E_PieceColor.White ? color(0) : color(255);
                    message = "Checkmate! " + (OppositePieceColor(playingColor) === E_PieceColor.White ? "White Wins" : "Black Wins");
                    break;
                case E_GameState.RESIGNED:
                    rectFillTargetColour = OppositePieceColor(playingColor) === E_PieceColor.White ? color(255) : color(0);
                    textColor = OppositePieceColor(playingColor) === E_PieceColor.White ? color(0) : color(255);
                    message = (OppositePieceColor(playingColor) === E_PieceColor.White ? "White Wins" : "Black Wins");
                    break;
                case E_GameState.STALEMATE:
                    rectFillTargetColour = color(175);
                    textColor = color(0);
                    message = "Stalemate!";
                    break;
                case E_GameState.DRAW:
                    rectFillTargetColour = color(175);
                    textColor = color(0);
                    message = "Draw!";
                    break;
            }

            let rectCenter = GAME_STATE_UI_SETTINGS.POSITION.x + BOARD_UI_SETTINGS.WIDTH / 2;
            graphics.noStroke();
            graphics.fill(rectFillTargetColour);
            graphics.rect(GAME_STATE_UI_SETTINGS.POSITION.x,
                GAME_STATE_UI_SETTINGS.POSITION.y,
                GAME_STATE_UI_SETTINGS.WIDTH,
                GAME_STATE_UI_SETTINGS.HEIGHT);

            graphics.textSize(GAME_STATE_UI_SETTINGS.TEXT_SIZE);
            graphics.fill(textColor);
            graphics.textStyle(BOLD);
            graphics.textAlign(CENTER, TOP);

            graphics.text(message,
                rectCenter,
                GAME_STATE_UI_SETTINGS.POSITION.y + GAME_STATE_UI_SETTINGS.TEXT_MARGIN);

            graphics.textStyle(NORMAL);
            graphics.textAlign(LEFT, BOTTOM);

        }
    }

    class PromotionSelector {
        #whiteSelectionUI;
        #blackSelectionUI;
        #background;


        #enabledSelector = null;
        #drawingCoordinates = {
            x: 0,
            y: 0
        };
        #onSelection = null;
        #clickListener = (event) => { this.#handleClick(); };

        constructor() {
            let whitePieces = [
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Queen)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Knight)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Rook)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.White, E_PieceType.Bishop)]
            ];

            let blackPieces = [
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Bishop)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Rook)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Knight)],
                Quadrille.chessSymbols[pieceColorTypeToKey(E_PieceColor.Black, E_PieceType.Queen)]
            ];

            this.#whiteSelectionUI = new Quadrille(1, whitePieces);
            this.#blackSelectionUI = new Quadrille(1, blackPieces);
            this.#background = new Quadrille(1, 4);
            this.#background.fill(color(PROMOTION_SELECTOR_SETTINGS.BACKGROUND_COLOR));
        }

        /**
         * 
         * @param {Promotion} promotion Promotion move
         * @param {function} onSelection Callback called when piece is successfully selected
         */
        selectNewPiece(promotion, onSelection) {
            console.log("select new piece");
            this.#onSelection = function (pieceTypeSelected) {
                promotion.newPieceType = pieceTypeSelected;
                onSelection();
            };
            //enable selector  on destination square
            let selector = promotion.endRank === 8 ? this.#whiteSelectionUI : this.#blackSelectionUI;
            this.#enableSelector(selector, promotion.endRank, promotion.endFile);
        }

        #enableSelector(selector, rank, file) {
            this.#enabledSelector = selector;

            let targetRow = NUMBER_OF_RANKS - rank + 1;
            let targetColumn = file;

            this.#drawingCoordinates.x = BOARD_UI_SETTINGS.LOCAL_POSITION.x + (targetColumn - 1) * BOARD_UI_SETTINGS.SQUARE_SIZE;
            this.#drawingCoordinates.y = selector === this.#whiteSelectionUI ?
                BOARD_UI_SETTINGS.LOCAL_POSITION.y + (targetRow - 1) * BOARD_UI_SETTINGS.SQUARE_SIZE :
                BOARD_UI_SETTINGS.LOCAL_POSITION.y + (targetRow - 4) * BOARD_UI_SETTINGS.SQUARE_SIZE;

            select('canvas').elt.addEventListener("click", this.#clickListener);
        }

        #disableSelector() {
            this.#enabledSelector = null;
            select('canvas').elt.removeEventListener("click", this.#clickListener);

        }

        draw(graphics) {
            if (this.#enabledSelector === null) return;
            graphics.drawQuadrille(this.#background,
                {
                    x: this.#drawingCoordinates.x,
                    y: this.#drawingCoordinates.y,
                    cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE
                });
            graphics.drawQuadrille(this.#enabledSelector,
                {
                    x: this.#drawingCoordinates.x,
                    y: this.#drawingCoordinates.y,
                    cellLength: BOARD_UI_SETTINGS.SQUARE_SIZE
                });
        }


        #handleClick() {
            //get piece selected
            let pieceSelected = this.#enabledSelector.read(this.#enabledSelector.mouseRow, 0);
            if (pieceSelected === undefined) return;

            let pieceKey = Quadrille.chessKeys[pieceSelected];
            let pieceType = pieceKeyToType(pieceKey);
            this.#onSelection(pieceType);
            this.#onSelection = undefined;
            this.#disableSelector();
        }
    }

    /*globals  createGraphics,deltaTime,random,image,createButton */


    //FENS
    const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

    //--GAME DIMENSIONS--
    const GAME_DIMENSIONS = {
        WIDTH: RANKS_FILES_UI_SETTING.CELL_LENGTH +
            BOARD_UI_SETTINGS.WIDTH +
            MOVE_RECORD_UI_SETTINGS.SPACE_FROM_BOARD +
            MOVE_RECORD_UI_SETTINGS.WIDTH,
        HEIGHT: RANKS_FILES_UI_SETTING.CELL_LENGTH +
            GAME_STATE_UI_SETTINGS.HEIGHT +
            GAME_STATE_UI_SETTINGS.SPACE_FROM_BOARD +
            BOARD_UI_SETTINGS.WIDTH +
            PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD +
            PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE
    };

    //****** assert, document
    class Game {
        //Game State
        #playingColor = E_PieceColor.White;
        #gameState = E_GameState.PLAYING;
        #gameMode = E_GameMode.STANDARD;
        get playingColor() {
            return this.#playingColor;
        }
        get state() {
            return this.#gameState;
        }
        #timerToMove = 0;
        #automaticMovesTimeInterval = 1000;
        /**
         * Time between moves in Automatic mode in miliseconds. 1000ms by default
         */
        set automaticMovesTimeInterval(value) {
            assert(typeof value === 'number', "Invalid value");
            this.#automaticMovesTimeInterval = value;
        }

        //Objects
        #legalMoves = [];
        get legalMoves() {
            return this.#legalMoves;
        }
        #moveRecord;
        #moveInput;
        #board;

        //UI
        #moveRecordUI;
        #moveInputUI;
        #piecesCapturedUI;
        #gameStateUI;
        #resignButton;
        #graphics;
        #promotionSelector;
        #position;

        /**
         * Creates a new chess game
         * @param {number} xPosition x position of game in canvas
         * @param {number} yPosition y position of game in canvas
         * @param {string} inputFen FEN of board
         * @param {E_PieceColor} playingColor Color that starts playing
         */
        constructor(xPosition, yPosition, inputFen = STANDARD_BOARD_FEN, playingColor = E_PieceColor.White) {
            this.#graphics = createGraphics(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
            this.#position = { x: xPosition, y: yPosition };

            this.#board = new Board(inputFen);
            this.#playingColor = playingColor;
            this.#legalMoves = this.#board.generateMoves(playingColor);

            this.#moveInput = new MoveInput(this.#board, xPosition + BOARD_UI_SETTINGS.LOCAL_POSITION.x, yPosition + BOARD_UI_SETTINGS.LOCAL_POSITION.y);
            this.#moveInput.enabled = true;
            this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
            this.#moveInput.addInputEventListener(MoveInput.inputEvents.onMoveInput, this.#onMoveInput.bind(this));

            this.#moveRecord = new MoveRecord();
            this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
            this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
            this.#gameStateUI = new GameStateUI(this);
            this.#promotionSelector = new PromotionSelector();
            this.#createResignButton();
        }

        isGameFinished() {
            return this.#gameState !== E_GameState.PLAYING;
        }

        isMoveLegal(inputMove) {

            let isSameMove = (move) => {
                return inputMove.startRank === move.startRank &&
                    inputMove.startFile === move.startFile &&
                    inputMove.endRank === move.endRank &&
                    inputMove.endFile === move.endFile;
            };

            //input move is legal if it is found in set of legal moves 
            let legalMove = this.#legalMoves.find(isSameMove);
            let isLegal = legalMove !== undefined;

            return {
                isLegal: isLegal,
                move: legalMove
            }
        }

        /**
         * Updates game state and view.
         */
        update() {
            if (this.#gameMode === E_GameMode.AUTOMATIC) {
                this.#runGameAutomatically();
            }
            this.#draw();
        }

        /**
         * Sets mode in which the game is playing.
         * STANDARD: Standard chess with all moves. Player makes moves on board.
         * AUTOMATIC: The machine will make random moves automatically until the game is finished. No draw offers.
         * FREE: Any color can move. Board might have a legal configuration or not. No end game. No option for resigning nor draw offers. Player makes moves on board.
         * @param {E_GameMode} gameMode 
         */
        setGameMode(gameMode) {
            assert(Object.values(E_GameMode).includes(gameMode), "Invalid game mode");
            this.#gameMode = gameMode;
            this.#generateLegalMoves();
            this.update();
            this.#updateInput();
        }

        #updateInput() {
            switch (this.#gameMode) {
                case E_GameMode.STANDARD:
                    this.#moveInput.enabled = !this.isGameFinished();
                    break;
                case E_GameMode.AUTOMATIC:
                    this.#moveInput.enabled = false;
                    break;
                case E_GameMode.FREE:
                    this.#moveInput.enabled = true;
                    break;
            }
        }

        #runGameAutomatically() {
            if (this.isGameFinished()) return;
            this.#timerToMove += deltaTime;
            if (this.#automaticMovesTimeInterval < this.#timerToMove) {
                let randomMove = random(this.#legalMoves);
                if (randomMove.flag === E_MoveFlag.Promotion) {
                    randomMove.newPieceType = random(PIECE_TYPES_TO_PROMOTE);
                }
                this.#makeMoveAndAdvance(randomMove);
                this.#timerToMove = 0;
            }
        }

        #draw() {
            this.#graphics.background(255);

            this.#moveRecordUI.draw(this.#graphics, this.#position.x, this.#position.y);
            this.#piecesCapturedUI.draw(this.#graphics);

            if (this.#gameMode !== E_GameMode.FREE) {
                this.#gameStateUI.draw(this.#graphics);
            }

            this.#board.draw(this.#graphics);
            this.#moveInputUI.draw(this.#graphics);
            this.#promotionSelector.draw(this.#graphics);

            this.#drawRanksAndFiles(this.#graphics);

            this.#updateResignButton();

            image(this.#graphics, this.#position.x, this.#position.y);
        }


        #onMoveInput(event) {
            //get input move
            let inputMove = event.detail.move;

            //if input move is legal
            let result = this.isMoveLegal(inputMove);
            if (result.isLegal) {
                let legalMove = result.move;
                if (legalMove.flag === E_MoveFlag.Promotion) {

                    this.#moveInput.enabled = false;
                    let onPieceSeleted = () => {
                        this.#makeMoveAndAdvance(legalMove);
                        this.#moveInput.enabled = true;
                    };
                    this.#promotionSelector.selectNewPiece(legalMove, onPieceSeleted.bind(this));

                } else {
                    this.#makeMoveAndAdvance(legalMove);
                }
            }
        }

        #makeMoveAndAdvance(move) {
            this.#moveRecord.recordMove(move, this.#board, this.#playingColor);
            //make move on board
            this.#board.makeMove(move);
            //switch playing color
            if (this.#gameMode !== E_GameMode.FREE) this.#switchPlayingColor();
            //generate new set of legal moves
            this.#generateLegalMoves();
            //check for end game conditions
            if (this.#gameMode !== E_GameMode.FREE) this.#checkEndGame(this.#playingColor);
        }

        #switchPlayingColor() {
            this.#playingColor = OppositePieceColor(this.#playingColor);
        }

        #generateLegalMoves() {
            this.#legalMoves = this.#board.generateMoves(this.#playingColor);
            if (this.#gameMode === E_GameMode.FREE) {
                this.#legalMoves = this.#legalMoves.concat(this.#board.generateMoves(OppositePieceColor(this.playingColor)));
            }
        }

        #checkEndGame(playingColor) {
            //if there are no moves left
            let legalMoves = this.#board.generateMoves(playingColor);
            if (legalMoves.length === 0) {
                //and king is in check
                if (this.#board.isKingInCheck(playingColor)) {
                    //game finished by checkmate
                    this.#gameState = E_GameState.CHECKMATE;
                }
                else {
                    //game finished by stalemate
                    this.#gameState = E_GameState.STALEMATE;
                }
            }
        }

        // #checkDraw() {
        //     if (false) {
        //         this.#gameState = E_GameState.DRAW;
        //     }
        // }

        #createResignButton() {
            let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
            button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
            button.mouseClicked(() => {
                this.#gameState = E_GameState.RESIGNED;
                button.hide();
            });
            this.#resignButton = button;
        }

        #updateResignButton() {
            if (this.isGameFinished() || this.#gameMode === E_GameMode.FREE) {
                this.#resignButton.hide();
            } else {
                this.#resignButton.show();
            }
        }

        #drawRanksAndFiles(graphics) {
            graphics.drawQuadrille(
                RANKS_FILES_UI_SETTING.RANKS,
                {
                    x: BOARD_UI_SETTINGS.LOCAL_POSITION.x - RANKS_FILES_UI_SETTING.CELL_LENGTH,
                    y: BOARD_UI_SETTINGS.LOCAL_POSITION.y,
                    cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                    textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                    textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                    outlineWeight: 0

                });

            graphics.drawQuadrille(
                RANKS_FILES_UI_SETTING.FILES,
                {
                    x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
                    y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT,
                    cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                    textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                    textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                    outlineWeight: 0
                });
        }

    }

    exports.BitboardUtils = BitboardUtils;
    exports.Board = Board;
    exports.ChessUtils = ChessUtils;
    exports.E_GameMode = E_GameMode;
    exports.E_MoveFlag = E_MoveFlag;
    exports.E_PieceColor = E_PieceColor;
    exports.E_PieceType = E_PieceType;
    exports.GAME_DIMENSIONS = GAME_DIMENSIONS;
    exports.Game = Game;

    return exports;

})({});
