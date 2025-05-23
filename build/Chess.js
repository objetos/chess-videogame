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

    const E_GameMode = Object.freeze({
        STANDARD: Symbol("Standard"),
        AUTOMATIC: Symbol("Automatic"),
        VIEW_ONLY: Symbol("View-Only"),
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

    class Move {
        #startRank;
        #startFile;
        #endRank;
        #endFile;
        #flag;
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
    const RANKS_TO_PROMOTE = {
        [E_PieceColor.White]: 7,
        [E_PieceColor.Black]: 2
    };
    const ENPASSANT_CAPTURING_RANKS = {
        [E_PieceColor.White]: 5,
        [E_PieceColor.Black]: 4
    };
    const PIECE_TYPES_TO_PROMOTE = [
        E_PieceType.Bishop,
        E_PieceType.Knight,
        E_PieceType.Queen,
        E_PieceType.Rook
    ];
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
    const PIECE_KEYS_BY_TYPE = {
        [E_PieceType.King]: 'k',
        [E_PieceType.Bishop]: 'b',
        [E_PieceType.Knight]: 'n',
        [E_PieceType.Queen]: 'q',
        [E_PieceType.Pawn]: 'p',
        [E_PieceType.Rook]: 'r'
    };
    const PIECE_TYPE_BY_KEY = {
        'k': E_PieceType.King,
        'b': E_PieceType.Bishop,
        'n': E_PieceType.Knight,
        'q': E_PieceType.Queen,
        'p': E_PieceType.Pawn,
        'r': E_PieceType.Rook
    };
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
    function pieceKeyToColor(pieceKey) {
        assertPieceKey(pieceKey);
        let color = pieceKey == pieceKey.toUpperCase() ? E_PieceColor.White : E_PieceColor.Black;
        return color;
    }
    function pieceKeyToType(pieceKey) {
        assertPieceKey(pieceKey);
        return PIECE_TYPE_BY_KEY[pieceKey.toLowerCase()];
    }
    function FileToLetter(file) {
        assertFile(file);
        return String.fromCharCode(96 + file);
    }
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
    const PIECES_CAPTURED_UI_SETTINGS = {
        PIECES_SIZE: 30,
        SPACE_FROM_BOARD: 0,
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
    const RANKS_FILES_UI_SETTING = {
        CELL_LENGTH: BOARD_UI_SETTINGS.SQUARE_SIZE,
        TEXT_ZOOM: 0.5,
        TEXT_COLOR: 0,
        RANKS: new Quadrille(1, ['8', '7', '6', '5', '4', '3', '2', '1']),
        FILES: new Quadrille(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
    };
    const RESIGN_BUTTON_UI_SETTINGS = {
        POSITION: {
            x: MOVE_RECORD_UI_SETTINGS.POSITION.x,
            y: MOVE_RECORD_UI_SETTINGS.POSITION.y + MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS.ROW_HEIGHT + 20
        },
        WIDTH: 40,
        HEIGHT: 20,
        TEXT: "Resign"
    };
    const RESET_BUTTON_UI_SETTINGS = {
        POSITION: {
            x: BOARD_UI_SETTINGS.LOCAL_POSITION.x,
            y: BOARD_UI_SETTINGS.LOCAL_POSITION.y + BOARD_UI_SETTINGS.HEIGHT + RANKS_FILES_UI_SETTING.CELL_LENGTH + PIECES_CAPTURED_UI_SETTINGS.SPACE_FROM_BOARD + PIECES_CAPTURED_UI_SETTINGS.PIECES_SIZE + 10
        },
        WIDTH: 40,
        HEIGHT: 20,
        TEXT: "Reset"
    };
    const MOVE_INPUT_UI_SETTINGS = {
        COLOR_FOR_SELECTED_SQUARES: 'rgba(100,100,100,0.5)',
        COLOR_FOR_AVAILABLE_MOVES: 'rgba(245, 246, 130,0.7)'
    };
    const PROMOTION_SELECTOR_SETTINGS = {
        BACKGROUND_COLOR: 'rgba(255,255,255,1)'
    };

    var UISettings = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BOARD_UI_SETTINGS: BOARD_UI_SETTINGS,
        GAME_STATE_UI_SETTINGS: GAME_STATE_UI_SETTINGS,
        MOVE_INPUT_UI_SETTINGS: MOVE_INPUT_UI_SETTINGS,
        MOVE_RECORD_UI_SETTINGS: MOVE_RECORD_UI_SETTINGS,
        PIECES_CAPTURED_UI_SETTINGS: PIECES_CAPTURED_UI_SETTINGS,
        PROMOTION_SELECTOR_SETTINGS: PROMOTION_SELECTOR_SETTINGS,
        RANKS_FILES_UI_SETTING: RANKS_FILES_UI_SETTING,
        RESET_BUTTON_UI_SETTINGS: RESET_BUTTON_UI_SETTINGS,
        RESIGN_BUTTON_UI_SETTINGS: RESIGN_BUTTON_UI_SETTINGS
    });

    const FIRST_FILE_BITBOARD = 0x0101010101010101n;
    const FIRST_RANK_BITBOARD = 0xFFn;
    function squareToBitboard(rank, file) {
        assertRank(rank);
        assertFile(file);
        let bitboard = 1n << BigInt(NUMBER_OF_FILES - file);
        bitboard = bitboard << BigInt((rank - 1) * NUMBER_OF_RANKS);
        return bitboard;
    }
    function getRay(startRank, startFile, destinationRank, destinationFile, includeStart = true, includeDestination = true) {
        assertRank(startRank);
        assertRank(destinationRank);
        assertRank(startFile);
        assertFile(destinationFile);
        assert(typeof includeStart === 'boolean', "includeStart is not boolean");
        assert(typeof includeStart === 'boolean', "includeDestination is not boolean");
        let start = squareToBitboard(startRank, startFile);
        let destination = squareToBitboard(destinationRank, destinationFile);
        if (startRank === destinationRank && startFile === destinationFile) {
            if (includeStart || includeDestination) return start;
            else return 0n;
        }
        let rankDiff = destinationRank - startRank;
        let fileDiff = destinationFile - startFile;
        let isPositiveRay = false;
        let mask = 0n;
        if (startRank === destinationRank) {
            mask = getRank(startRank);
            isPositiveRay = destinationFile < startFile;
        } else if (startFile === destinationFile) {
            mask = getFile(startFile);
            isPositiveRay = startRank < destinationRank;
        } else if (Math.abs(rankDiff) === Math.abs(fileDiff)) {
            let isDiagonal = Math.sign(rankDiff) === Math.sign(fileDiff);
            if (isDiagonal) {
                mask = getDiagonal(startRank, startFile);
                isPositiveRay = 0 < rankDiff && 0 < fileDiff;
            } else {
                mask = getAntiDiagonal(startRank, startFile);
                isPositiveRay = 0 < rankDiff && fileDiff < 0;
            }
        } else {
            return 0n;
        }
        let rays = hyperbolaQuintessenceAlgorithm(destination, start, mask);
        let ray = isPositiveRay ? rays.positiveRay : rays.negativeRay;
        if (includeStart) ray = ray | start;
        if (!includeDestination) ray = ray & ~destination;
        return ray;
    }
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
    function reverseBitboard(bitboard) {
        assert(typeof bitboard === 'bigint', "Invalid bitboard");
        let bitboardString = bitboardToString(bitboard);
        let numberOfBits = bitboardString.length;
        if (bitboardString.length < 64) {
            let bitsLeftToAdd = 64 - numberOfBits;
            bitboardString = "0".repeat(bitsLeftToAdd) + bitboardString;
        }
        let reversedBitboardString = bitboardString.split('').reverse().join('');
        let reversedBitboard = BigInt("0b" + reversedBitboardString);
        return reversedBitboard;
    }
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
    function twosComplement(binaryString) {
        let complement = BigInt('0b' + binaryString.split('').map(e => e === "0" ? "1" : "0").join(''));
        return complement + BigInt(1);
    }
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
    function getBooleanBitboard(bool) {
        assert(typeof bool === 'boolean', "Invalid argument");
        if (bool) {
            return 0xFFFFFFFFFFFFFFFFn;
        } else {
            return 0x0000000000000000n;
        }
    }
    function getFile(fileNumber) {
        assertFile(fileNumber);
        let fileBitboard = FIRST_FILE_BITBOARD;
        fileBitboard = fileBitboard << BigInt(8 - fileNumber);
        return fileBitboard;
    }
    function getRank(rankNumber) {
        assertRank(rankNumber);
        let rankBitboard = FIRST_RANK_BITBOARD;
        rankBitboard = rankBitboard << BigInt((rankNumber - 1) * NUMBER_OF_RANKS);
        return rankBitboard;
    }
    function getDiagonal(rank, file) {
        assertRank(rank);
        assertFile(file);
        let diagonalNumber = (9 - file) + rank - 1;
        let clampedDiagonalNumber = diagonalNumber;
        if (8 < diagonalNumber) {
            clampedDiagonalNumber = 8 - (diagonalNumber % 8);
        }
        let diagonalBitboard = 1n;
        for (let i = 1; i < clampedDiagonalNumber; i++) {
            diagonalBitboard = (diagonalBitboard << 1n) | (1n << BigInt(8 * i));
        }
        if (8 < diagonalNumber) {
            diagonalBitboard = flipDiagonally(diagonalBitboard);
        }
        return diagonalBitboard;
    }
    function getAntiDiagonal(rank, file) {
        assertRank(rank);
        assertFile(file);
        let diagonalBitboard = getDiagonal(rank, 9 - file);
        let antiDiagonalBitboard = mirrorHorizontally(diagonalBitboard);
        return antiDiagonalBitboard;
    }
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

    class Piece {
        #color = E_PieceColor.None;
        #rank = 0;
        #file = 0;
        #position = 0;
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
        GetType() {
            throw new Error("Method 'GetType()' must be implemented.");
        }
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
        GetMoves(board) {
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
        GetMoves(board) {
            let currentSquare = (this.rank - 1) * NUMBER_OF_FILES + (NUMBER_OF_FILES - this.file + 1);
            let moves = 0n;
            if (19 <= currentSquare) {
                moves = this.#attackMask << BigInt(currentSquare - 19);
            } else {
                moves = this.#attackMask >> BigInt(19 - currentSquare);
            }
            if (this.file < 3) {
                moves = moves & ~getFile(7) & ~getFile(8);
            } else if (6 < this.file) {
                moves = moves & ~getFile(1) & ~getFile(2);
            }
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
        GetMoves(board) {
            let oneSquareFront;
            let twoSquaresFront;
            let rightDiagonalSquare;
            let leftDiagonalSquare;
            let targetRankForJumping;
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
            let frontMove = oneSquareFront &
                board.getEmptySpaces();
            let frontJump = twoSquaresFront &
                getBooleanBitboard(frontMove > 1) &
                board.getEmptySpaces() &
                getRank(targetRankForJumping);
            let rightCapture = rightDiagonalSquare &
                board.getOccupied(OppositePieceColor(this.color)) &
                ~getFile(1);
            let leftCapture = leftDiagonalSquare &
                board.getOccupied(OppositePieceColor(this.color)) &
                ~getFile(8);
            return frontJump | frontMove | leftCapture | rightCapture;
        }
        GetCapturingSquares() {
            let rightDiagonalSquare;
            let leftDiagonalSquare;
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
                ~getFile(1);
            let leftCapture = leftDiagonalSquare &
                ~getFile(8);
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
        GetMoves(board) {
            let currentSquare = (this.rank - 1) * 8 + (9 - this.file);
            let moves = 0n;
            if (10 <= currentSquare) {
                moves = this.#attackMask << BigInt(currentSquare - 10);
            } else {
                moves = this.#attackMask >> BigInt(10 - currentSquare);
            }
            if (this.file < 3) {
                moves = moves & ~getFile(7) & ~getFile(8);
            } else if (6 < this.file) {
                moves = moves & ~getFile(1) & ~getFile(2);
            }
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
        #piecesDictionary = {};
        #board = new Quadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        #castlingRights;
        #enPassantInfo;
        constructor(inputBoard, castlingRights, enPassantInfo) {
            for (let color of Object.values(E_PieceColor)) {
                this.#piecesDictionary[color] = {};
                for (let type of Object.values(E_PieceType)) {
                    this.#piecesDictionary[color][type] = new Array();
                }
            }
            for (let rankIndex = 0; rankIndex < NUMBER_OF_RANKS; rankIndex++) {
                for (let fileIndex = 0; fileIndex < NUMBER_OF_RANKS; fileIndex++) {
                    let pieceSymbol = inputBoard.read(rankIndex, fileIndex);
                    if (pieceSymbol !== null) {
                        let pieceKey = Quadrille.chessKeys[pieceSymbol];
                        let rank = NUMBER_OF_RANKS - rankIndex;
                        let file = fileIndex + 1;
                        let pieceObject = this.#createPiece(pieceKey, rank, file);
                        this.addPiece(pieceObject, rank, file);
                    }
                }
            }
            this.#castlingRights = castlingRights;
            this.#enPassantInfo = enPassantInfo;
        }
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
        getPieceOnRankFile(rank, file) {
            assertRank(rank);
            assertFile(file);
            let rankIndex = NUMBER_OF_RANKS - rank;
            let fileIndex = file - 1;
            return this.#board.read(rankIndex, fileIndex);
        }
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
        getOccupied(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
            assertPieceType(pieceType);
            assertPieceColor(pieceColor);
            let occupied = 0n;
            let pieces = [];
            if (pieceColor === E_PieceColor.Any && pieceType === E_PieceType.Any) return this.#board.toBigInt();
            pieces = this.getPiecesOfType(pieceColor, pieceType);
            for (let piece of pieces) {
                let position = piece.position;
                occupied = occupied | position;
            }
            return occupied;
        }
        getEmptySpaces() {
            let occupied = this.getOccupied();
            let empty = ~occupied;
            return empty;
        }
        getAttackedSquares(pieceColor = E_PieceColor.Any, pieceType = E_PieceType.Any) {
            assertPieceType(pieceType);
            assertPieceColor(pieceColor);
            let attacksBitboard = 0n;
            let pieces = this.getPiecesOfType(pieceColor, pieceType);
            pieces.forEach(piece => {
                let pieceAttackMoves;
                if (piece.GetType() !== E_PieceType.Pawn) {
                    pieceAttackMoves = piece.GetMoves(this);
                }
                else {
                    pieceAttackMoves = piece.GetCapturingSquares();
                }
                attacksBitboard |= pieceAttackMoves;
            });
            return attacksBitboard;
        }
        isKingInCheck(kingColor) {
            assertPieceColor(kingColor);
            let king = this.getPiecesOfType(kingColor, E_PieceType.King)[0];
            if (king === undefined) return false;
            let squaresAttackedByEnemy = this.getAttackedSquares(OppositePieceColor(kingColor));
            return (king.position & squaresAttackedByEnemy) > 0n;
        }
        hasCastlingRights(color, castlingSide) {
            assertPieceColor(color);
            assert(castlingSide === E_CastlingSide.QueenSide || castlingSide === E_CastlingSide.KingSide, "Invalid castling side");
            return this.#castlingRights[color][castlingSide];
        }
        getEnPassantInfo() {
            return this.#enPassantInfo;
        }
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

    class MoveGenerator {
        generateMoves(board, pieceColor) {
            assert(board instanceof BoardImplementation, "Invalid board");
            assertPieceColor(pieceColor);
            let inputColor = pieceColor;
            let legalMoves = [];
            let playingPieces = board.getPiecesOfType(inputColor, E_PieceType.Any);
            let enemyPieces = board.getPiecesOfType(OppositePieceColor(inputColor), E_PieceType.Any);
            let king = board.getPiecesOfType(inputColor, E_PieceType.King)[0];
            let squaresToPreventCheck = getBooleanBitboard(true);
            let pinnedPieces = {};
            if (king !== undefined) {
                let checkers = this.#calculateCheckers(king, enemyPieces, board);
                let kingSafeMoves = this.#generateKingSafeMoves(king, enemyPieces, board);
                if (1 < checkers.length) {
                    return kingSafeMoves;
                }
                else if (checkers.length === 1) {
                    squaresToPreventCheck = this.#calculateSquaresToPreventCheck(king, checkers[0], board);
                }
                pinnedPieces = this.#calculatePinnedPieces(king, enemyPieces, board);
                legalMoves = legalMoves.concat(kingSafeMoves);
            }
            for (let piece of playingPieces) {
                if (piece.GetType() === E_PieceType.King) continue;
                let pieceMovesBitboard = piece.GetMoves(board);
                pieceMovesBitboard = pieceMovesBitboard & squaresToPreventCheck;
                let isPiecePinned = pinnedPieces[piece.position] !== undefined;
                if (isPiecePinned) {
                    let pinnedPieceSafeSquares = pinnedPieces[piece.position];
                    pieceMovesBitboard = pieceMovesBitboard & pinnedPieceSafeSquares;
                }
                if (piece.GetType() === E_PieceType.Pawn && piece.isBeforePromotingRank()) {
                    let promotionsMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Promotion);
                    legalMoves = legalMoves.concat(promotionsMoves);
                }
                else {
                    let pieceMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Regular);
                    legalMoves = legalMoves.concat(pieceMoves);
                }
            }
            let pawns = board.getPiecesOfType(inputColor, E_PieceType.Pawn);
            let enPassantMoves = this.#generateEnPassantMoves(pawns, board);
            legalMoves = legalMoves.concat(enPassantMoves);
            let rooks = board.getPiecesOfType(inputColor, E_PieceType.Rook);
            let castlingMoves = this.#generateCastlingMoves(king, rooks, board);
            legalMoves = legalMoves.concat(castlingMoves);
            return legalMoves;
        }
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
        #generateKingSafeMoves(king, enemyPieces, board) {
            let dangerousSquaresForKing = 0n;
            board.removePiece(king.rank, king.file);
            let squaresAttackedByEnemy = board.getAttackedSquares(OppositePieceColor(king.color));
            let dangerouseCaptures = this.#calculateProtectedPieces(enemyPieces, board);
            board.addPiece(king, king.rank, king.file);
            dangerousSquaresForKing = dangerouseCaptures | squaresAttackedByEnemy;
            let kingMovesBitboard = king.GetMoves(board) & ~dangerousSquaresForKing;
            return this.#bitboardToMoves(king, kingMovesBitboard, E_MoveFlag.Regular);
        }
        #calculateProtectedPieces(enemyPieces, board) {
            if (enemyPieces.length == 0) return;
            let protectedPieces = 0n;
            let squaresOccupiedByEnemyPieces = board.getOccupied(enemyPieces[0].color);
            for (let enemyPiece of enemyPieces) {
                if (enemyPiece.IsSlider()) {
                    let slider = enemyPiece;
                    let occupied = board.getOccupied();
                    let rays = slider.getSlidingRays();
                    let position = slider.position;
                    let slidingMoves = 0n;
                    rays.forEach(ray => {
                        let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
                        slidingMoves = slidingMoves | movesInRay.wholeRay;
                    });
                    protectedPieces |= slidingMoves & squaresOccupiedByEnemyPieces;
                }
                else if (enemyPiece.GetType() === E_PieceType.Pawn) {
                    let pawn = enemyPiece;
                    let pawnCapturingSquares = pawn.GetCapturingSquares();
                    protectedPieces |= pawnCapturingSquares & squaresOccupiedByEnemyPieces;
                }
                else if (enemyPiece.GetType() === E_PieceType.Knight | enemyPiece.GetType() === E_PieceType.King) {
                    let emptyBoard = new BoardImplementation(new Quadrille('8/8/8/8/8/8/8/8'));
                    let enemyMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                    protectedPieces |= enemyMovesInEmptyBoard & squaresOccupiedByEnemyPieces;
                }
            }
            return protectedPieces;
        }
        #calculateSquaresToPreventCheck(king, checker) {
            if (checker.IsSlider()) {
                return getRay(checker.rank, checker.file, king.rank, king.file, true, false);
            }
            else {
                return checker.position;
            }
        }
        #calculatePinnedPieces(king, enemyPieces, board) {
            let pinnedPieces = {};
            for (let enemyPiece of enemyPieces) {
                if (!enemyPiece.IsSlider()) continue;
                let slider = enemyPiece;
                let sliderRays = slider.getSlidingRays();
                let rayFromSliderToKing = getRay(slider.rank, slider.file, king.rank, king.file, false, true);
                if (rayFromSliderToKing === 0n) continue;
                let isSliderAllowedToMoveOnRay = false;
                for (let ray of sliderRays) {
                    if ((ray & rayFromSliderToKing) > 0n) {
                        isSliderAllowedToMoveOnRay = true;
                    }
                }
                if (!isSliderAllowedToMoveOnRay) continue;
                let occupied = board.getOccupied();
                let attacksFromSliderToKing = hyperbolaQuintessenceAlgorithm(occupied, slider.position, rayFromSliderToKing);
                let attacksFromKingToSlider = hyperbolaQuintessenceAlgorithm(occupied, king.position, rayFromSliderToKing);
                let emptySpaceBetweenKingAndSlider = rayFromSliderToKing & ~king.position;
                let intersection = attacksFromKingToSlider.wholeRay & attacksFromSliderToKing.wholeRay;
                if (intersection === 0n) ;
                else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenKingAndSlider) ; else {
                    let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                    if (isPieceAnAlly) {
                        let pinnedPosition = intersection;
                        let legalSquares = rayFromSliderToKing | slider.position;
                        pinnedPieces[pinnedPosition] = legalSquares;
                    }
                }
            }
            return pinnedPieces;
        }
        #generateEnPassantMoves(pawns, board) {
            let enPassantMoves = [];
            let enPassantInfo = board.getEnPassantInfo();
            for (let capturingPawn of pawns) {
                if (enPassantInfo.rightToEnPassant === false) continue;
                if (capturingPawn.rank !== ENPASSANT_CAPTURING_RANKS[capturingPawn.color]) continue;
                let rankDiff = Math.abs(enPassantInfo.captureRank - capturingPawn.rank);
                let fileDiff = Math.abs(enPassantInfo.captureFile - capturingPawn.file);
                if (fileDiff !== 1 || rankDiff !== 0) continue;
                let targetRank = capturingPawn.color === E_PieceColor.White ?
                    capturingPawn.rank + 1 : capturingPawn.rank - 1;
                let enPassant = new Move(capturingPawn.rank, capturingPawn.file, targetRank, enPassantInfo.captureFile, E_MoveFlag.EnPassant);
                if (!this.#isEnPassantLegal(capturingPawn.color, enPassant, board)) continue;
                enPassantMoves.push(enPassant);
            }
            return enPassantMoves;
        }
        #isEnPassantLegal(playingColor, enPassant, board) {
            let capturedPawnRank = enPassant.startRank;
            let capturedPawnFile = enPassant.endFile;
            let capturingPawnRank = enPassant.startRank;
            let capturingPawnFile = enPassant.startFile;
            let inCheckBeforeEnPassant = board.isKingInCheck(playingColor);
            let capturedPawn = board.removePiece(capturedPawnRank, capturedPawnFile);
            let capturingPawn = board.removePiece(capturingPawnRank, capturingPawnFile);
            let inCheckAfterEnPassant = board.isKingInCheck(playingColor);
            board.addPiece(capturedPawn, capturedPawnRank, capturedPawnFile);
            board.addPiece(capturingPawn, capturingPawnRank, capturingPawnFile);
            if (!inCheckBeforeEnPassant & !inCheckAfterEnPassant) {
                return true;
            } else if (inCheckBeforeEnPassant && !inCheckAfterEnPassant) {
                return true;
            } else if (!inCheckBeforeEnPassant & inCheckAfterEnPassant) {
                return false;
            } else if (inCheckBeforeEnPassant & inCheckAfterEnPassant) {
                return false;
            }
        }
        #generateCastlingMoves(king, rooks, board) {
            if (king === undefined) return [];
            if (rooks === undefined || rooks.length === 0) return [];
            if (board.isKingInCheck(king.color)) return [];
            if (!king.isOnInitialSquare()) return [];
            let castlingMoves = [];
            for (let rook of rooks) {
                if (!rook.isOnInitialSquare()) continue;
                let castlingSide = king.file > rook.file ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                if (!board.hasCastlingRights(rook.color, castlingSide)) continue;
                let pathFromKingToRook = castlingSide === E_CastlingSide.QueenSide ?
                    king.position << 1n | king.position << 2n | king.position << 3n :
                    king.position >> 1n | king.position >> 2n;
                let isCastlingPathObstructed = (board.getEmptySpaces() & pathFromKingToRook) !== pathFromKingToRook;
                if (isCastlingPathObstructed) continue;
                let kingPathToCastle = castlingSide === E_CastlingSide.QueenSide ?
                    king.position << 1n | king.position << 2n :
                    king.position >> 1n | king.position >> 2n;
                let attackedSquares = board.getAttackedSquares(OppositePieceColor(king.color));
                let isKingPathChecked = (kingPathToCastle & attackedSquares) > 0n;
                if (isKingPathChecked) continue;
                let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King].endFile;
                let kingMove = new Castling(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
                castlingMoves.push(kingMove);
            }
            return castlingMoves;
        }
        #bitboardToMoves(piece, bitboard, moveFlag) {
            let moves = [];
            let testBit = 1n;
            if (bitboard === 0n) return [];
            for (let index = 0; index < 64; index++) {
                if (0n < (bitboard & testBit)) {
                    let endRank = Math.floor((index) / NUMBER_OF_FILES) + 1;
                    let endFile = NUMBER_OF_FILES - (index % NUMBER_OF_FILES);
                    let newMove;
                    if (moveFlag === E_MoveFlag.Promotion) {
                        newMove = new Promotion(piece.rank, piece.file, endRank, endFile);
                    } else if (moveFlag === E_MoveFlag.Castling) {
                        newMove = new Castling(piece.rank, piece.file, endRank, endFile);
                    } else {
                        newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                    }
                    moves.push(newMove);
                }
                testBit = testBit << 1n;
            }
            return moves;
        }
    }

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
        constructor(board, globalBoardPositionX, globalBoardPositionY) {
            assert(board instanceof Board, "Invalid board");
            assert(typeof globalBoardPositionX === 'number', "Invalid board x position");
            assert(typeof globalBoardPositionY === 'number', "Invalid board y position");
            super();
            this.#inputListener = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
            this.#board = board;
            select('canvas').mouseClicked(() => {
                this.#handleClick(globalBoardPositionX, globalBoardPositionY);
            });
        }
        addInputEventListener(event, callback) {
            assert(Object.values(MoveInput.inputEvents).includes(event), "Invalid event");
            this.addEventListener(event, callback);
        }
        reset() {
            this.#CancelMove();
        }
        #handleClick(boardPositionX, boardPositionY) {
            if (!this.#enabled) return;
            let clickedRank = 8 - this.#inputListener.screenRow(mouseY, boardPositionY, BOARD_UI_SETTINGS.SQUARE_SIZE);
            let clickedFile = this.#inputListener.screenCol(mouseX, boardPositionX, BOARD_UI_SETTINGS.SQUARE_SIZE) + 1;
            let clickedSquare = {
                rank: clickedRank,
                file: clickedFile
            };
            let isClickWithinBoardLimits = 1 <= clickedRank && clickedRank <= NUMBER_OF_RANKS && 1 <= clickedFile && clickedFile <= NUMBER_OF_FILES;
            if (!isClickWithinBoardLimits) {
                if (this.#inputMoveStart !== null) {
                    this.#CancelMove();
                }
                return;
            }
            let squareSelectedEvent = new CustomEvent(MoveInput.inputEvents.onSquareSelected, { detail: { square: clickedSquare } });
            this.dispatchEvent(squareSelectedEvent);
            let pieceInClickedSquare = this.#board.getPieceOnRankFile(clickedRank, clickedFile) !== null;
            if (this.#inputMoveStart === null && pieceInClickedSquare) {
                this.#inputMoveStart = {
                    rank: clickedRank,
                    file: clickedFile
                };
                let moveStartSetEvent = new CustomEvent(MoveInput.inputEvents.onMoveStartSet, { detail: { square: clickedSquare } });
                this.dispatchEvent(moveStartSetEvent);
            }
            else if (this.#inputMoveStart !== null && this.#inputMoveDestination === null) {
                if ((this.#inputMoveStart.rank === clickedRank && this.#inputMoveStart.file === clickedFile)) {
                    this.#CancelMove();
                    return;
                }
                this.#inputMoveDestination = {
                    rank: clickedRank,
                    file: clickedFile
                };
                let moveDestinationSet = new CustomEvent(MoveInput.inputEvents.onMoveDestinationSet, { detail: { square: clickedSquare } });
                this.dispatchEvent(moveDestinationSet);
                let inputMove = new Move(this.#inputMoveStart.rank, this.#inputMoveStart.file, this.#inputMoveDestination.rank, this.#inputMoveDestination.file);
                let moveInput = new CustomEvent(MoveInput.inputEvents.onMoveInput, { detail: { move: inputMove } });
                this.dispatchEvent(moveInput);
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
    }

    class Board {
        #moveGenerator;
        #boardImplementation;
        #board = new Quadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
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
        #startFen = undefined;
        constructor(inputFen) {
            assert(typeof inputFen === 'string', "Invalid FEN");
            this.#moveGenerator = new MoveGenerator();
            this.#board = new Quadrille(inputFen);
            this.#calculateCastlingRights();
            this.#boardImplementation = new BoardImplementation(this.#board, this.#castlingRights, this.#enPassantInfo);
            Quadrille.whiteSquare = BOARD_UI_SETTINGS.WHITE_SQUARE_COLOR;
            Quadrille.blackSquare = BOARD_UI_SETTINGS.BLACK_SQUARE_COLOR;
            this.#boardBackground = new Quadrille();
            this.#startFen = inputFen;
        }
        generateMoves(pieceColor) {
            assertPieceColor(pieceColor);
            return this.#moveGenerator.generateMoves(this.#boardImplementation, pieceColor);
        }
        makeMove(move) {
            assert(move instanceof Move, "Invalid input move");
            try {
                this.#recordNewBoardChanges();
                this.#updateCastlingRights(move);
                this.#updateEnPassantInfo(move);
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
                this.#boardImplementation = new BoardImplementation(this.#board, this.#castlingRights, this.#enPassantInfo);
            } catch (error) {
                console.log(move);
                this.print();
                this.#popBoardChanges();
                throw error;
            }
        }
        unmakeMove() {
            let lastChanges = this.#popBoardChanges();
            if (lastChanges === undefined) return;
            let numberOfChanges = lastChanges.length;
            try {
                for (let i = 0; i < numberOfChanges; i++) {
                    let change = lastChanges.pop();
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
                this.#boardImplementation = new BoardImplementation(this.#board, this.#castlingRights, this.#enPassantInfo);
            } catch (error) {
                console.log(lastChanges);
                throw error;
            }
        }
        getFen() {
            return this.#board.toFEN();
        }
        getPieceOnRankFile(rank, file) {
            assertRank(rank);
            assertFile(file);
            let rankIndex = NUMBER_OF_RANKS - rank;
            let fileIndex = file - 1;
            return this.#board.read(rankIndex, fileIndex);
        }
        getCapturedPieces(pieceColor) {
            assertPieceColor(pieceColor);
            return this.#capturedPieces[pieceColor];
        }
        isKingInCheck(kingColor) {
            assertPieceColor(kingColor);
            return this.#boardImplementation.isKingInCheck(kingColor);
        }
        hasCastlingRights(color, castlingSide) {
            assertPieceColor(color);
            assert(castlingSide === E_CastlingSide.QueenSide || castlingSide === E_CastlingSide.KingSide, "Invalid castling side");
            return this.#castlingRights[color][castlingSide];
        }
        getEnPassantInfo() {
            return this.#enPassantInfo;
        }
        reset() {
            this.#board = new Quadrille(this.#startFen);
            this.#calculateCastlingRights();
            this.#enPassantInfo.rightToEnPassant = false;
            this.#enPassantInfo.captureRank = null;
            this.#enPassantInfo.captureFile = null;
            this.#boardChanges = [];
            this.#capturedPieces[E_PieceColor.White] = "";
            this.#capturedPieces[E_PieceColor.Black] = "";
            this.#boardImplementation = new BoardImplementation(this.#board, this.#castlingRights, this.#enPassantInfo);
        }
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
            let pieceInDestination = this.getPieceOnRankFile(move.endRank, move.endFile);
            if (pieceInDestination !== null) {
                assert(pieceInDestination.toLowerCase() !== 'k', "King capture is forbidden");
                this.#capturePiece(move.endRank, move.endFile);
            }
            let pieceToMove = this.getPieceOnRankFile(move.startRank, move.startFile);
            this.#removePiece(move.startRank, move.startFile);
            this.#addPiece(pieceToMove, move.endRank, move.endFile);
        }
        #makePromotionMove(move) {
            this.#makeRegularMove(move);
            let pawn = this.#removePiece(move.endRank, move.endFile);
            let pawnKey = Quadrille.chessKeys[pawn];
            let newPieceType = move.newPieceType;
            let pieceColor = pieceKeyToColor(pawnKey);
            let pieceKey = pieceColorTypeToKey(pieceColor, newPieceType);
            let pieceSymbol = Quadrille.chessSymbols[pieceKey];
            this.#addPiece(pieceSymbol, move.endRank, move.endFile);
        }
        #makeCastlingMove(move) {
            this.#makeRegularMove(move);
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
            this.#makeRegularMove(move);
            this.#capturePiece(move.startRank, move.endFile);
        }
        #capturePiece(rank, file) {
            let pieceSymbol = this.getPieceOnRankFile(rank, file);
            let pieceColor = pieceKeyToColor(Quadrille.chessKeys[pieceSymbol]);
            this.#capturedPieces[pieceColor] += pieceSymbol;
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
        #calculateCastlingRights() {
            for (let color of Object.values(E_PieceColor)) {
                if (color === E_PieceColor.None || color === E_PieceColor.Any) continue;
                this.#setCastlingRights(color, E_CastlingSide.KingSide, false);
                this.#setCastlingRights(color, E_CastlingSide.QueenSide, false);
                let kingKey = pieceColorTypeToKey(color, E_PieceType.King);
                let kingSymbol = Quadrille.chessSymbols[kingKey];
                let kingPos = this.#board.search(createQuadrille([kingSymbol]), true)[0];
                if (kingPos === undefined) {
                    continue;
                } else {
                    let rank = NUMBER_OF_RANKS - kingPos.row;
                    let file = kingPos.col + 1;
                    let isKingOnInitialSquare = color === E_PieceColor.White ?
                        (rank === 1 && file === 5) :
                        (rank === 8 && file === 5);
                    if (!isKingOnInitialSquare) {
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
        }
        #updateCastlingRights(move) {
            let pieceInStart = this.#boardImplementation.getPieceOnRankFile(move.startRank, move.startFile);
            let pieceInDestination = this.#boardImplementation.getPieceOnRankFile(move.endRank, move.endFile);
            let isCastlingMove = move.flag === E_MoveFlag.Castling;
            if (isCastlingMove) {
                let king = pieceInStart;
                let castlingSide = move.castlingSide;
                let oppositeCastlingSide = castlingSide === E_CastlingSide.KingSide ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                this.#disableCastlingRights(king.color, castlingSide);
                this.#disableCastlingRights(king.color, oppositeCastlingSide);
            } else {
                if (pieceInStart.GetType() === E_PieceType.Rook) {
                    let rook = pieceInStart;
                    let rookCastlingSide = rook.file === 1 ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                    if (rook.isOnInitialSquare() && this.hasCastlingRights(rook.color, rookCastlingSide)) {
                        this.#disableCastlingRights(rook.color, rookCastlingSide);
                    }
                }
                else if (pieceInStart.GetType() === E_PieceType.King) {
                    let king = pieceInStart;
                    this.#disableCastlingRights(king.color, E_CastlingSide.KingSide);
                    this.#disableCastlingRights(king.color, E_CastlingSide.QueenSide);
                }
                if (pieceInDestination !== null && pieceInDestination.GetType() === E_PieceType.Rook) {
                    let rook = pieceInDestination;
                    let rookCastlingSide = rook.file === 1 ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
                    if (rook.isOnInitialSquare() && this.hasCastlingRights(rook.color, rookCastlingSide)) {
                        this.#disableCastlingRights(rook.color, rookCastlingSide);
                    }
                }
            }
        }
        #setCastlingRights(color, castlingSide, enabled) {
            assert(Object.values(E_CastlingSide).includes(castlingSide), "Invalid castling side");
            this.#castlingRights[color][castlingSide] = enabled;
        }
        #disableCastlingRights(color, castlingSide) {
            if (this.hasCastlingRights(color, castlingSide)) {
                this.#castlingRights[color][castlingSide] = false;
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
            if (pawnPerfomedJump) {
                this.#enableEnPassant(move.endRank, move.endFile);
                let enPassantUpdate = {
                    type: this.#E_BoardChangeType.EnPassantUpdate,
                    rightToEnPassant: true
                };
                this.#pushBoardChange(enPassantUpdate);
            }
            else if (isEnPassantEnabled) {
                let enPassantUpdate = {
                    type: this.#E_BoardChangeType.EnPassantUpdate,
                    rightToEnPassant: false,
                    oldCaptureRank: this.#enPassantInfo.captureRank,
                    oldCaptureFile: this.#enPassantInfo.captureFile
                };
                this.#pushBoardChange(enPassantUpdate);
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
            onMoveUnrecorded: "system:move-recorded",
            onClear: "system:move-record-clear"
        }
        #record = [];
        recordMove(move, board, playingColor) {
            let moveString = "";
            if (move.flag === E_MoveFlag.Castling) {
                moveString = move.castlingSide === E_CastlingSide.KingSide ? "0-0" : "0-0-0";
                let onMoveRecorded = new CustomEvent(MoveRecord.events.onMoveRecorded, { detail: { move: moveString } });
                this.dispatchEvent(onMoveRecorded);
                this.#record.push(moveString);
                return moveString;
            }
            let pieceInStart = board.getPieceOnRankFile(move.startRank, move.startFile);
            let isCapturingMove = board.getPieceOnRankFile(move.endRank, move.endFile) !== null || move.flag === E_MoveFlag.EnPassant;
            let isPawn = (pieceInStart === Quadrille.chessSymbols['P']) || (pieceInStart === Quadrille.chessSymbols['p']);
            if (isPawn) {
                if (isCapturingMove) moveString += FileToLetter(move.startFile);
            } else {
                moveString += pieceInStart;
            }
            if (!isPawn) {
                moveString += this.#calculateMoveDisambiguation(board, playingColor, move, pieceInStart, moveString);
            }
            if (isCapturingMove) {
                moveString += 'x';
            }
            let rank = move.endRank.toString();
            let file = FileToLetter(move.endFile);
            let destination = file + rank;
            moveString += destination;
            switch (move.flag) {
                case E_MoveFlag.EnPassant:
                    moveString += 'e.p';
                    break;
                case E_MoveFlag.Promotion:
                    moveString += '=' + pieceColorTypeToKey(playingColor, move.newPieceType);
                    break;
            }
            board.makeMove(move);
            let enemyColor = OppositePieceColor(playingColor);
            let enemyLegalMoves = board.generateMoves(enemyColor);
            let isEnemyKingInCheck = board.isKingInCheck(enemyColor);
            if (enemyLegalMoves.length === 0 && isEnemyKingInCheck) {
                moveString += '#';
            }
            else if (enemyLegalMoves.length !== 0 && isEnemyKingInCheck) {
                moveString += '+';
            }
            board.unmakeMove();
            let onMoveRecorded = new CustomEvent(MoveRecord.events.onMoveRecorded, { detail: { move: moveString } });
            this.dispatchEvent(onMoveRecorded);
            this.#record.push(moveString);
            return moveString;
        }
        #calculateMoveDisambiguation(board, playingColor, moveToRecord, pieceToMove) {
            let disambiguation = '';
            let piecesInSameRank = false;
            let piecesInSameFile = false;
            let ambiguityExists = false;
            let legalMoves = board.generateMoves(playingColor);
            for (let otherMove of legalMoves) {
                if (moveToRecord.startRank === otherMove.startRank && moveToRecord.startFile === otherMove.startFile) continue;
                let otherPiece = board.getPieceOnRankFile(otherMove.startRank, otherMove.startFile);
                let isSamePiece = pieceToMove === otherPiece;
                let otherMoveHasSameDestination = (otherMove.endRank === moveToRecord.endRank) && (otherMove.endFile === moveToRecord.endFile);
                if (isSamePiece && otherMoveHasSameDestination) {
                    ambiguityExists = true;
                    if (moveToRecord.startFile === otherMove.startFile) {
                        piecesInSameFile = true;
                    }
                    if (moveToRecord.startRank === otherMove.startRank) {
                        piecesInSameRank = true;
                    }
                }
            }
            if (ambiguityExists && !piecesInSameFile && !piecesInSameRank) disambiguation += FileToLetter(moveToRecord.startFile);
            else {
                if (ambiguityExists && piecesInSameRank) disambiguation += FileToLetter(moveToRecord.startFile);
                if (ambiguityExists && piecesInSameFile) disambiguation += moveToRecord.startRank;
            }
            return disambiguation;
        }
        unrecordMove() {
            this.#record.pop();
            let onMoveUnrecorded = new CustomEvent(MoveRecord.events.onMoveRecorded);
            this.dispatchEvent(onMoveUnrecorded);
        }
        getRecord() {
            return [...this.#record];
        }
        clear() {
            this.#record = [];
            let onClear = new CustomEvent(MoveRecord.events.onClear);
            this.dispatchEvent(onClear);
        }
    }

    class MoveInputUI {
        #game;
        #UIQuadrille;
        #colorForSelectedSquare;
        #colorForAvailableMoves;
        #moveCompleted = false;
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
            if (this.#moveCompleted) {
                this.#Clear();
                this.#moveCompleted = false;
            }
            let square = event.detail.square;
            this.#fillSquare(square.rank, square.file, this.#colorForSelectedSquare);
            for (let move of this.#game.legalMoves) {
                if (move.startRank === square.rank && move.startFile === square.file) {
                    this.#fillSquare(move.endRank, move.endFile, this.#colorForAvailableMoves);
                }
            }
        }
        #onMoveDestinationSet(event) {
            this.#fillSquare(event.detail.square.rank, event.detail.square.file, this.#colorForSelectedSquare);
        }
        #fillSquare(rank, file, color) {
            let row = 8 - rank;
            let column = file - 1;
            this.#UIQuadrille.fill(row, column, color);
        }
        #onMoveInput(event) {
            let result = this.#game.isMoveLegal(event.detail.move);
            if (!result.isLegal) {
                this.#Clear();
            } else {
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
            moveRecord.addEventListener(MoveRecord.events.onClear, this.#onClear.bind(this));
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
        #onClear(event) {
            this.#table.clear();
            this.#table.fill(0, 0, 1);
            this.#table.height = 1;
            this.#currentColumnIndex = 1;
            this.#firstVisibleRow = 1;
            this.#updateButtons();
        }
        #addNewEntry(move) {
            if (this.#isRowFill()) {
                this.#addNewRow();
                this.#table.fill(this.#lastRowIndex, 0, this.#lastRowNumber);
                this.#currentColumnIndex = 1;
            }
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
                this.#firstVisibleRow = this.#lastRowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE + 1;
            }
        }
        #updateButtons() {
            if (this.#firstVisibleRow < 2 && this.#table.height <= MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE) {
                this.#upButton.hide();
                this.#downButton.hide();
            }
            else if (this.#firstVisibleRow < 2 && MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
                this.#upButton.hide();
                this.#downButton.show();
            }
            else if (2 <= this.#firstVisibleRow && this.#lastVisibleRow < this.#table.height) {
                this.#upButton.show();
                this.#downButton.show();
            }
            else {
                this.#upButton.show();
                this.#downButton.hide();
            }
        }
        draw(graphics, graphicsX, graphicsY) {
            if (this.#lastRowIndex === 0 && this.#table.isEmpty(0, 1)) return;
            let tableToDraw = this.#table;
            if (MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE < this.#table.height) {
                let firstVisibleRowIndex = this.#firstVisibleRow - 1;
                tableToDraw = this.#table.row(firstVisibleRowIndex);
                for (let i = 1; i < MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE; i++) {
                    let rowIndex = firstVisibleRowIndex + i;
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

    class GameStateUI {
        #game;
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
                    rectFillTargetColour = this.#game.winningColor === E_PieceColor.White ? color(255) : color(0);
                    textColor = this.#game.winningColor === E_PieceColor.White ? color(0) : color(255);
                    message = "Checkmate! " + (this.#game.winningColor === E_PieceColor.White ? "White Wins" : "Black Wins");
                    break;
                case E_GameState.RESIGNED:
                    rectFillTargetColour = this.#game.winningColor === E_PieceColor.White ? color(255) : color(0);
                    textColor = this.#game.winningColor === E_PieceColor.White ? color(0) : color(255);
                    message = (this.#game.winningColor === E_PieceColor.White ? "White Wins" : "Black Wins");
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
        selectNewPiece(promotion, onSelection) {
            console.log("select new piece");
            this.#onSelection = function (pieceTypeSelected) {
                promotion.newPieceType = pieceTypeSelected;
                onSelection();
            };
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
            let pieceSelected = this.#enabledSelector.read(this.#enabledSelector.mouseRow, 0);
            if (pieceSelected === undefined) return;
            let pieceKey = Quadrille.chessKeys[pieceSelected];
            let pieceType = pieceKeyToType(pieceKey);
            this.#onSelection(pieceType);
            this.#onSelection = undefined;
            this.#disableSelector();
        }
    }

    const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
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
    class Game {
        #playingColor = E_PieceColor.White;
        #gameState = E_GameState.PLAYING;
        #gameMode = E_GameMode.STANDARD;
        #timerToMove = 0;
        #automaticMovesTimeInterval = 1000;
        #winningColor = null;
        #startColor = undefined;
        get playingColor() {
            return this.#playingColor;
        }
        get state() {
            return this.#gameState;
        }
        get winningColor() {
            return this.#winningColor;
        }
        set automaticMovesTimeInterval(value) {
            assert(typeof value === 'number', "Invalid value");
            this.#automaticMovesTimeInterval = value;
        }
        #legalMoves = [];
        get legalMoves() {
            return this.#legalMoves;
        }
        #moveRecord;
        #moveInput;
        #board;
        get board() {
            return this.#board;
        }
        #moveRecordUI;
        #moveInputUI;
        #piecesCapturedUI;
        #gameStateUI;
        #resignButton;
        #resetButton;
        #graphics;
        #promotionSelector;
        #position;
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
            this.#createResetButton();
            this.#startColor = playingColor;
            this.#checkEndGame(playingColor);
            this.#checkEndGame(OppositePieceColor(playingColor));
            this.update();
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
            let legalMove = this.#legalMoves.find(isSameMove);
            let isLegal = legalMove !== undefined;
            return {
                isLegal: isLegal,
                move: legalMove
            }
        }
        update() {
            if (this.#gameMode === E_GameMode.AUTOMATIC) {
                this.#runGameAutomatically();
            }
            this.#draw();
        }
        setGameMode(gameMode) {
            assert(Object.values(E_GameMode).includes(gameMode), "Invalid game mode");
            this.#gameMode = gameMode;
            this.#generateLegalMoves();
            this.#checkEndGame(this.#playingColor);
            this.#checkEndGame(OppositePieceColor(this.#playingColor));
            this.update();
            this.#updateInput();
        }
        reset() {
            this.#gameState = E_GameState.PLAYING;
            this.#playingColor = this.#startColor;
            this.#board.reset();
            this.#moveRecord.clear();
            this.#moveInput.reset();
            this.#winningColor = null;
            this.#generateLegalMoves();
            this.#checkEndGame(this.#playingColor);
            this.#checkEndGame(OppositePieceColor(this.#playingColor));
            this.update();
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
                case E_GameMode.VIEW_ONLY:
                    this.#moveInput.enabled = false;
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
            this.#updateResetButton();
            image(this.#graphics, this.#position.x, this.#position.y);
        }
        #onMoveInput(event) {
            let inputMove = event.detail.move;
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
            this.#board.makeMove(move);
            if (this.#gameMode !== E_GameMode.FREE) this.#switchPlayingColor();
            this.#generateLegalMoves();
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
            let legalMoves = this.#board.generateMoves(playingColor);
            if (legalMoves.length === 0) {
                if (this.#board.isKingInCheck(playingColor)) {
                    this.#gameState = E_GameState.CHECKMATE;
                    this.#winningColor = OppositePieceColor(playingColor);
                }
                else {
                    this.#gameState = E_GameState.STALEMATE;
                }
            }
        }
        #createResignButton() {
            let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
            button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
            button.mouseClicked(this.#onResign.bind(this));
            this.#resignButton = button;
        }
        #createResetButton() {
            let button = createButton(RESET_BUTTON_UI_SETTINGS.TEXT);
            button.position(this.#position.x + RESET_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESET_BUTTON_UI_SETTINGS.POSITION.y);
            button.mouseClicked(() => {
                this.reset();
            });
            this.#resetButton = button;
        }
        #updateResetButton() {
            if (this.#gameMode === E_GameMode.VIEW_ONLY) {
                this.#resetButton.hide();
            } else {
                this.#resetButton.show();
            }
        }
        #updateResignButton() {
            if (this.isGameFinished() || this.#gameMode === E_GameMode.FREE || this.#gameMode === E_GameMode.VIEW_ONLY) {
                this.#resignButton.hide();
            } else {
                this.#resignButton.show();
            }
        }
        #onResign() {
            this.#gameState = E_GameState.RESIGNED;
            this.#winningColor = OppositePieceColor(this.#playingColor);
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

    exports.Bishop = Bishop;
    exports.BitboardUtils = BitboardUtils;
    exports.Board = Board;
    exports.BoardImplementation = BoardImplementation;
    exports.ChessUtils = ChessUtils;
    exports.E_CastlingSide = E_CastlingSide;
    exports.E_GameMode = E_GameMode;
    exports.E_MoveFlag = E_MoveFlag;
    exports.E_PieceColor = E_PieceColor;
    exports.E_PieceType = E_PieceType;
    exports.GAME_DIMENSIONS = GAME_DIMENSIONS;
    exports.Game = Game;
    exports.King = King;
    exports.Knight = Knight;
    exports.Pawn = Pawn;
    exports.Queen = Queen;
    exports.Rook = Rook;
    exports.UISettings = UISettings;

    return exports;

})({});
