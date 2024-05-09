'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const E_MoveFlag$1 = Object.freeze({
    Promotion: Symbol("Promotion"),
    QueenSideCastling: Symbol("QueenSideCastling"),
    KingSideCastling: Symbol("KingSideCastling"),
    EnPassant: Symbol("EnPassant"),
    Regular: Symbol("Regular"),
    None: Symbol("None")
});

const E_PieceColor$1 = Object.freeze({
    Black: Symbol("Black"),
    White: Symbol("White"),
    None: Symbol("None"),
    Any: Symbol("Any")
});

const E_PieceType$1 = Object.freeze({
    King: Symbol("King"),
    Queen: Symbol("Queen"),
    Bishop: Symbol("Bishop"),
    Rook: Symbol("Rook"),
    Knight: Symbol("Knight"),
    Pawn: Symbol("Pawn"),
    None: Symbol("None"),
    Any: Symbol("Any")
});

const NUMBER_OF_RANKS$1 = 8;
const NUMBER_OF_FILES$1 = 8;

/**
 * Files involved in castling. Provide castling side and piece which is moving (rook or king)
 */
({
    [E_MoveFlag$1.QueenSideCastling]: {
        [E_PieceType$1.King]: {
            startFile: 5,
            endFile: 3
        },
        [E_PieceType$1.Rook]: {
            startFile: 1,
            endFile: 4
        },
    },
    [E_MoveFlag$1.KingSideCastling]: {
        [E_PieceType$1.King]: {
            startFile: 5,
            endFile: 7
        },
        [E_PieceType$1.Rook]: {
            startFile: 8,
            endFile: 6
        }
    }
});

/**
 * Ranks where pawns can promote. Provide color
 */
({
    [E_PieceColor$1.White]: 7,
    [E_PieceColor$1.Black]: 2
});

/**
 * Ranks where pawns can perform an en-passant capture. Provide color
 */
({
    [E_PieceColor$1.White]: 5,
    [E_PieceColor$1.Black]: 4
});

/**
 * Provide type to return lowercase piece key
 */
const PIECE_KEYS_BY_TYPE = {
    [E_PieceType$1.King]: 'k',
    [E_PieceType$1.Bishop]: 'b',
    [E_PieceType$1.Knight]: 'n',
    [E_PieceType$1.Queen]: 'q',
    [E_PieceType$1.Pawn]: 'p',
    [E_PieceType$1.Rook]: 'r'
};

/**
 * Provide piece key in lowercase to return piece type
 */
({
    'k': E_PieceType$1.King,
    'b': E_PieceType$1.Bishop,
    'n': E_PieceType$1.Knight,
    'q': E_PieceType$1.Queen,
    'p': E_PieceType$1.Pawn,
    'r': E_PieceType$1.Rook
});

/**
 * Transforms piece color and type to piece key
 * @param {E_PieceColor} pieceColor 
 * @param {E_PieceType} pieceType 
 * @returns piece key
 */
function pieceColorTypeToKey$1(pieceColor, pieceType) {
    assertPieceColor(pieceColor);
    assertPieceType(pieceType);

    assert(pieceColor !== E_PieceColor$1.Any, "No piece color provided");
    assert(pieceType !== E_PieceType$1.Any, "No piece type provided");

    let pieceString = PIECE_KEYS_BY_TYPE[pieceType];

    if (pieceColor === E_PieceColor$1.White) {
        pieceString = pieceString.toUpperCase();
    }

    return pieceString;
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
            let castlingSide = king.file > rook.file ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
            if (!board.hasCastlingRights(rook.color, castlingSide)) continue;

            //There cannot be any piece between the rook and the king
            let castlingPath = castlingSide === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n | king.position << 3n :
                king.position >> 1n | king.position >> 2n;

            let isCastlingPathObstructed = (board.getEmptySpaces() & castlingPath) !== castlingPath;

            //Your king can not pass through check
            let attackedSquares = board.getAttackedSquares(OppositePieceColor(king.color));
            let kingPathToCastle = castlingSide === E_MoveFlag.QueenSideCastling ?
                king.position << 1n | king.position << 2n :
                king.position >> 1n | king.position >> 2n;

            let isKingPathChecked = (kingPathToCastle & attackedSquares) > 0n;

            if (!isCastlingPathObstructed && !isKingPathChecked) {
                let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King].endFile;
                let kingMove = new Move(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
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
                let newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                //add move to array
                moves.push(newMove);
            }

            //continue to next square
            testBit = testBit << 1n;
        }

        return moves;
    }
}

let BoardImplementation$1 = class BoardImplementation {
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


};

function assert$1(condition, message) {
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

function assertRank$1(rank) {
    assert$1(rank !== undefined, "No rank provided");
    assert$1(typeof rank === "number", "Rank Invalid");
    assert$1(Number.isInteger(rank), "Rank is not an integer");
    assert$1(rank >= 1 && rank <= NUMBER_OF_RANKS, "Rank " + rank + " is out of bounds.");

}

function assertFile$1(file) {
    assert$1(file !== undefined, "No file provided");
    assert$1(typeof file === "number", "File Invalid");
    assert$1(Number.isInteger(file), "File is not an integer");
    assert$1(file >= 1 && file <= NUMBER_OF_FILES, "File " + file + " is out of bounds.");
}

function assertPieceColor$1(pieceColor) {
    assert$1(Object.values(E_PieceColor).includes(pieceColor), "Invalid piece color");
    assert$1(pieceColor !== E_PieceColor.None, "No piece color provided");
}

//******  CLASS PROLOG, ASSERT AND DOCUMENT PRIVATE METHODS
let Board$1 = class Board {
    #moveGenerator;
    #boardImplementation;

    #board = new Quadrille(NUMBER_OF_FILES$1, NUMBER_OF_RANKS$1); //board with pieces in symbol representation

    #boardChanges = [];
    #E_BoardChangeType = Object.freeze({
        Addition: Symbol("Addition"),
        Removal: Symbol("Removal"),
        CastlingRigthsChange: Symbol("CastlingRigthsChange"),
        EnPassantUpdate: Symbol("EnPassantUpdate"),
        Capture: Symbol("Capture")
    })

    #castlingRights = {
        [E_PieceColor$1.White]: {
            [E_MoveFlag$1.KingSideCastling]: false,
            [E_MoveFlag$1.QueenSideCastling]: false
        }, [E_PieceColor$1.Black]: {
            [E_MoveFlag$1.KingSideCastling]: false,
            [E_MoveFlag$1.QueenSideCastling]: false
        }
    }

    #enPassantInfo = {
        rightToEnPassant: false,
        captureRank: null,
        captureFile: null
    }

    #capturedPieces = {
        [E_PieceColor$1.White]: "",
        [E_PieceColor$1.Black]: ""
    }

    /**
    * Creates a new chess board
    * @param {string} inputFen FEN of board
    */
    constructor(inputFen) {
        assert$1(typeof inputFen === 'string', "Invalid FEN");

        //initialize move generator
        this.#moveGenerator = new MoveGenerator();
        //initialize board
        this.#board = new Quadrille(inputFen);

        //calculate castling rights
        //for each color
        for (let color of Object.values(E_PieceColor$1)) {
            if (color === E_PieceColor$1.None || color === E_PieceColor$1.Any) continue;

            let kingKey = pieceColorTypeToKey$1(color, E_PieceType$1.King);
            let kingSymbol = Quadrille.chessSymbols[kingKey];
            let kingPos = this.#board.search(createQuadrille([kingSymbol]), true)[0];
            //if board has no king or king has moved from initial square
            if (kingPos === undefined) {
                //no castling is possible
                this.#setCastlingRights(color, E_MoveFlag$1.KingSideCastling, false);
                this.#setCastlingRights(color, E_MoveFlag$1.QueenSideCastling, false);
                continue;

            } else { //else if there's a king
                let rank = NUMBER_OF_RANKS$1 - kingPos.row;
                let file = kingPos.col + 1;
                let isKingOnInitialSquare = color === E_PieceColor$1.White ?
                    (rank === 1 && file === 5) :
                    (rank === 8 && file === 5);
                //if king is not in its initial square
                if (!isKingOnInitialSquare) {
                    //no castling is possible
                    this.#setCastlingRights(color, E_MoveFlag$1.KingSideCastling, false);
                    this.#setCastlingRights(color, E_MoveFlag$1.QueenSideCastling, false);
                    continue;
                }
            }

            let rookKey = pieceColorTypeToKey$1(color, E_PieceType$1.Rook);
            let rookSymbol = Quadrille.chessSymbols[rookKey];
            let rookPositions = this.#board.search(createQuadrille([rookSymbol]), true);
            for (let rookPosition of rookPositions) {

                let rank = NUMBER_OF_RANKS$1 - rookPosition.row;
                let file = rookPosition.col + 1;
                let isRookOnInitialSquare = color === E_PieceColor$1.White ?
                    (rank === 1 && file === 1) | (rank === 1 && file === 8) :
                    (rank === 8 && file === 1) | (rank === 8 && file === 8);

                if (isRookOnInitialSquare) {
                    let castlingSide = file === 1 ? E_MoveFlag$1.QueenSideCastling : E_MoveFlag$1.KingSideCastling;
                    this.#setCastlingRights(color, castlingSide, true);
                }
            }
        }

        //initialize board implementation
        this.#boardImplementation = new BoardImplementation$1(inputFen, this.#castlingRights, this.#enPassantInfo);
    }


    /**
     * @param {E_PieceColor} color
     * @return {Move[]} Array of legal moves of pieces of given color
     */
    generateMoves(pieceColor) {
        assertPieceColor$1(pieceColor);
        return this.#moveGenerator.generateMoves(this.#boardImplementation, pieceColor);
    }

    /**
     * Applies move to board
     * @param {Move} move 
     */
    makeMove(move) {
        assert$1(move instanceof Move, "Invalid input move");
        try {
            //start recording new board changes
            this.#recordNewBoardChanges();
            //update board information
            this.#updateCastlingRights(move);
            this.#updateEnPassantInfo(move);
            //apply move
            switch (move.flag) {
                case E_MoveFlag$1.Regular:
                    this.#makeRegularMove(move);
                    break;
                case E_MoveFlag$1.Promotion:
                    this.#makePromotionMove(move);
                    break;
                case E_MoveFlag$1.KingSideCastling:
                    this.#makeCastlingMove(move);
                    break;
                case E_MoveFlag$1.QueenSideCastling:
                    this.#makeCastlingMove(move);
                    break;
                case E_MoveFlag$1.EnPassant:
                    this.#makeEnPassantMove(move);
                    break;
                default:
                    throw new Error("Failed making move. Move has no valid flag");
            }
            this.#boardImplementation = new BoardImplementation$1(this.getFen(), this.#castlingRights, this.#enPassantInfo);
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
                        this.#capturedPieces[E_PieceColor$1.White] = this.#capturedPieces[E_PieceColor$1.White].replace(change.piece, "");
                        this.#capturedPieces[E_PieceColor$1.Black] = this.#capturedPieces[E_PieceColor$1.Black].replace(change.piece, "");
                        this.#addPiece(change.piece, change.rank, change.file, false);
                        break;
                    default:
                        throw new Error("Invalid board change");
                }
            }
            this.#boardImplementation = new BoardImplementation$1(this.getFen(), this.#castlingRights, this.#enPassantInfo);
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
        assertRank$1(rank);
        assertFile$1(file);
        let rankIndex = NUMBER_OF_RANKS$1 - rank;
        let fileIndex = file - 1;
        return this.#board.read(rankIndex, fileIndex);
    }

    /**
     * 
     * @param {E_PieceColor} pieceColor 
     * @returns String with all pieces of given color that have been captured
     */
    getCapturedPieces(pieceColor) {
        assertPieceColor$1(pieceColor);
        return this.#capturedPieces[pieceColor];
    }

    /**
     * 
     * @param {E_PieceColor} kingColor 
     * @returns Whether the king of given color is being checked or not
     */
    isKingInCheck(kingColor) {
        assertPieceColor$1(kingColor);
        return this.#boardImplementation.isKingInCheck(kingColor);
    }

    /**
     * Draws board
     */
    draw(graphics) {
        graphics.drawQuadrille(this.#board, { x: BOARD_LOCAL_POSITION.x, y: BOARD_LOCAL_POSITION.y, cellLength: BOARD_SQUARE_SIZE });
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

            if (((col + 1) % NUMBER_OF_FILES$1) === 0) {
                string += "\n";
            }
        });

        console.log(string);
    }



    /**
     * Adds a piece to given rank and file
     * @param {string} pieceSymbol 
     * @param {Number} rank 
     * @param {Number} file 
     */
    #addPiece(pieceSymbol, rank, file, recordChange = true) {
        assert$1(Object.values(Quadrille.chessSymbols).includes(pieceSymbol));
        assertRank$1(rank);
        assertRank$1(file);

        if (this.getPieceOnRankFile(rank, file) !== null) {
            throw new Error("Cannot add piece in a occupied square");
        }

        let rankIndex = NUMBER_OF_RANKS$1 - rank;
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
     * @param {Number} rank 
     * @param {Number} file 
     * @param {boolean} recordChange record removal so it can be undone?
     * @returns 
     */
    #removePiece(rank, file, recordChange = true) {
        assertRank$1(rank);
        assertRank$1(file);

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

        let rankIndex = NUMBER_OF_RANKS$1 - rank;
        let fileIndex = file - 1;
        this.#board.clear(rankIndex, fileIndex);

        return pieceToRemove;
    }


    #makeRegularMove(move) {
        //if there's a piece in destination
        let pieceInDestination = this.getPieceOnRankFile(move.endRank, move.endFile);
        if (pieceInDestination !== null) {
            assert$1(pieceInDestination.toLowerCase() !== 'k', "King capture is forbidden");
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
        let pieceTypeToPromote = MoveInput.pieceSelectedForPromotion;
        let pieceColor = pieceKeyToColor(pawnKey);
        //create piece symbol
        let pieceKey = pieceColorTypeToKey$1(pieceColor, pieceTypeToPromote);
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
            CASTLING_FILES[move.flag][E_PieceType$1.Rook].startFile,
            move.startRank,
            CASTLING_FILES[move.flag][E_PieceType$1.Rook].endFile,
            E_MoveFlag$1.Regular
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
        //console.trace();
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
        let isCastlingMove = move.flag === E_MoveFlag$1.KingSideCastling | move.flag === E_MoveFlag$1.QueenSideCastling;
        if (isCastlingMove) {

            //remove castling rights from both sides
            let king = pieceInStart;
            let castlingSide = move.flag;
            let oppositeCastlingSide = move.flag === E_MoveFlag$1.KingSideCastling ? E_MoveFlag$1.QueenSideCastling : E_MoveFlag$1.KingSideCastling;
            this.#disableCastlingRights(king.color, castlingSide);
            this.#disableCastlingRights(king.color, oppositeCastlingSide);

        } else {

            //if a rook is moving
            if (pieceInStart.GetType() === E_PieceType$1.Rook) {
                let rook = pieceInStart;
                let rookCastlingSide = rook.file === 1 ? E_MoveFlag$1.QueenSideCastling : E_MoveFlag$1.KingSideCastling;

                //if the rook that's moving is on its initial corner and hasn't moved
                if (rook.isOnInitialSquare() && this.#hasCastlingRights(rook.color, rookCastlingSide)) {
                    //Remove castling rights from this rook's side
                    this.#disableCastlingRights(rook.color, rookCastlingSide);
                }
            } //else if a king is moving
            else if (pieceInStart.GetType() === E_PieceType$1.King) {
                let king = pieceInStart;
                //if the king has not moved before
                let hasKingMoved = !(king.isOnInitialSquare() &&
                    this.#hasCastlingRights(king.color, E_MoveFlag$1.KingSideCastling) &&
                    this.#hasCastlingRights(king.color, E_MoveFlag$1.QueenSideCastling));
                if (!hasKingMoved) {
                    //remove castling rights from both sides
                    this.#disableCastlingRights(king.color, E_MoveFlag$1.KingSideCastling);
                    this.#disableCastlingRights(king.color, E_MoveFlag$1.QueenSideCastling);
                }
            }

            //if a rook is captured
            if (pieceInDestination !== null && pieceInDestination.GetType() === E_PieceType$1.Rook) {
                let rook = pieceInDestination;
                let rookCastlingSide = rook.file === 1 ? E_MoveFlag$1.QueenSideCastling : E_MoveFlag$1.KingSideCastling;

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
     * @param {E_MoveFlag} castlingSide 
     * @returns Whether the given side has rights to castle (It does not necesarilly mean castling is possible).
     */
    #hasCastlingRights(color, castlingSide) {
        assertPieceColor$1(color);
        assert$1(castlingSide === E_MoveFlag$1.QueenSideCastling || castlingSide === E_MoveFlag$1.KingSideCastling, "Invalid castling side");

        return this.#castlingRights[color][castlingSide];
    }

    #setCastlingRights(color, castlingSide, enabled) {
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
        let pawnPerfomedJump = pieceInStart.GetType() === E_PieceType$1.Pawn && Math.abs(move.startRank - move.endRank) === 2;
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
        assertRank$1(captureRank);
        assertRank$1(captureFile);
        this.#enPassantInfo.rightToEnPassant = true;
        this.#enPassantInfo.captureRank = captureRank;
        this.#enPassantInfo.captureFile = captureFile;
    }

    #disableEnPassant() {
        this.#enPassantInfo.rightToEnPassant = false;
        this.#enPassantInfo.captureRank = null;
        this.#enPassantInfo.captureFile = null;
    }

};

const E_GameState$1 = Object.freeze({
    PLAYING: Symbol("Playing"),
    CHECKMATE: Symbol("Checkmate"),
    STALEMATE: Symbol("Stalemate"),
    DRAW: Symbol("Draw"),
    RESIGNED: Symbol("Resigned"),
});

let MoveRecord$1 = class MoveRecord extends EventTarget {
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
        if (move.flag === E_MoveFlag.KingSideCastling || move.flag === E_MoveFlag.QueenSideCastling) {
            //add castling mark
            moveString = move.flag === E_MoveFlag.KingSideCastling ? "0-0" : "0-0-0";
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
                moveString += '=' + pieceColorTypeToKey(playingColor, MoveInput.pieceSelectedForPromotion);
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
};

let MoveInput$1 = class MoveInput extends EventTarget {
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

    /**
     * @param {Board} board Board that Input should listen to
     * @param {Number} globalBoardPositionX x position of board in canvas in pixels
     * @param {Number} globalBoardPositionY y position of board in canvas in pixels
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
        //get click coordinates relative to page
        let xCoordinate = clickX;
        let yCoordinate = clickY;
        //get clicked square

        let clickedRank = 8 - this.#inputListener.screenRow(yCoordinate, boardPositionY, BOARD_SQUARE_SIZE);
        let clickedFile = this.#inputListener.screenCol(xCoordinate, boardPositionX, BOARD_SQUARE_SIZE) + 1;
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

    static #pieceSelectedForPromotion = E_PieceType$1.Queen;

    static get pieceSelectedForPromotion() {
        return this.#pieceSelectedForPromotion;
    }

    static set pieceSelectedForPromotion(value) {
        assertPieceType(value);
        assert(value !== E_PieceType$1.Pawn, "Promotion to Pawn is forbidden");
        assert(value !== E_PieceType$1.King, "Promotion to King is forbidden");
        this.#pieceSelectedForPromotion = value;
    }
};

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
        graphics.drawQuadrille(this.#UIQuadrille, { x: BOARD_LOCAL_POSITION.x, y: BOARD_LOCAL_POSITION.y, cellLength: BOARD_SQUARE_SIZE });
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

        const TABLE_HEIGHT = MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE * Quadrille.cellLength;
        const TABLE_WIDTH = 3 * Quadrille.cellLength;

        this.#upButton = createButton("Up");
        this.#upButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20,
            MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 - 25);
        this.#upButton.mouseClicked(() => {
            this.#firstVisibleRow--;
            this.#updateButtons();
        });
        this.#upButton.hide();

        this.#downButton = createButton("Down");
        this.#downButton.position(MOVE_RECORD_UI_SETTINGS.POSITION.x + TABLE_WIDTH + 20,
            MOVE_RECORD_UI_SETTINGS.POSITION.y + TABLE_HEIGHT / 2 + 25);
        this.#downButton.mouseClicked(() => {
            this.#firstVisibleRow++;
            this.#updateButtons();
        });

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
            this.#firstVisibleRow = rowNumber - MOVE_RECORD_UI_SETTINGS.MAX_ROWS_VISIBLE + 1;
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

    draw(graphics) {
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

        let rectCenter = GAME_STATE_UI_SETTINGS.POSITION.x + BOARD_WIDTH / 2;
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

//UI SETTINGS ----------------------------------------------------------------
//--Board--
const BOARD_SQUARE_SIZE$1 = 40;
const BOARD_WIDTH$1 = BOARD_SQUARE_SIZE$1 * NUMBER_OF_FILES$1;
const BOARD_HEIGHT$1 = BOARD_SQUARE_SIZE$1 * NUMBER_OF_RANKS$1;
const BOARD_LOCAL_POSITION$1 = {
    get x() { return BOARD_SQUARE_SIZE$1 },
    get y() { return GAME_STATE_UI_SETTINGS$1.HEIGHT + GAME_STATE_UI_SETTINGS$1.SPACE_FROM_BOARD }
};
//--Pieces Captured UI--
const PIECES_CAPTURED_UI_SETTINGS$1 = {
    PIECES_SIZE: 30,
    SPACE_FROM_BOARD: 10,
    get WHITE_PIECES_POSITION() {
        return {
            x: BOARD_LOCAL_POSITION$1.x,
            y: BOARD_LOCAL_POSITION$1.y - this.PIECES_SIZE - this.SPACE_FROM_BOARD
        }
    },
    get BLACK_PIECES_POSITION() {
        return {
            x: BOARD_LOCAL_POSITION$1.x,
            y: BOARD_LOCAL_POSITION$1.y + BOARD_HEIGHT$1 + this.SPACE_FROM_BOARD + RANKS_FILES_UI_SETTING.CELL_LENGTH
        }
    }
};
//--Game State UI--
const GAME_STATE_UI_SETTINGS$1 = {
    TEXT_SIZE: 20,
    TEXT_MARGIN: 10,
    SPACE_FROM_BOARD: 55,
    WIDTH: BOARD_WIDTH$1,
    get HEIGHT() {
        return this.TEXT_SIZE + 2 * this.TEXT_MARGIN;
    },
    get POSITION() {
        return {
            x: BOARD_LOCAL_POSITION$1.x,
            y: BOARD_LOCAL_POSITION$1.y - this.TEXT_SIZE - this.TEXT_MARGIN - this.SPACE_FROM_BOARD
        }
    }
};
//--Move Record UI--
const MOVE_RECORD_UI_SETTINGS$1 = {
    CELL_LENGTH: 40,
    SPACE_FROM_BOARD: 20,
    MAX_ROWS_VISIBLE: 8,
    get POSITION() {
        return {
            x: BOARD_LOCAL_POSITION$1.x + BOARD_WIDTH$1 + this.SPACE_FROM_BOARD,
            y: BOARD_LOCAL_POSITION$1.y
        }
    },
    ROW_HEIGHT: BOARD_SQUARE_SIZE$1,
    WIDTH: BOARD_SQUARE_SIZE$1 * 3
};
//--Resign Button--
const RESIGN_BUTTON_UI_SETTINGS = {
    POSITION: {
        x: MOVE_RECORD_UI_SETTINGS$1.POSITION.x,
        y: MOVE_RECORD_UI_SETTINGS$1.POSITION.y + MOVE_RECORD_UI_SETTINGS$1.MAX_ROWS_VISIBLE * MOVE_RECORD_UI_SETTINGS$1.ROW_HEIGHT + 20
    },
    WIDTH: 40,
    HEIGHT: 20,
    TEXT: "Resign"
};
//--Rank Files UI--
const RANKS_FILES_UI_SETTING = {
    CELL_LENGTH: BOARD_SQUARE_SIZE$1,
    TEXT_ZOOM: 0.5,
    TEXT_COLOR: 0,
    RANKS: new Quadrille(1, ['8', '7', '6', '5', '4', '3', '2', '1']),
    FILES: new Quadrille(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'])
};

//FENS
const STANDARD_BOARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';

//--GAME DIMENSIONS--
const GAME_DIMENSIONS = {
    WIDTH: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        BOARD_WIDTH$1 +
        MOVE_RECORD_UI_SETTINGS$1.SPACE_FROM_BOARD +
        MOVE_RECORD_UI_SETTINGS$1.WIDTH,
    HEIGHT: RANKS_FILES_UI_SETTING.CELL_LENGTH +
        GAME_STATE_UI_SETTINGS$1.HEIGHT +
        GAME_STATE_UI_SETTINGS$1.SPACE_FROM_BOARD +
        BOARD_WIDTH$1 +
        PIECES_CAPTURED_UI_SETTINGS$1.SPACE_FROM_BOARD +
        PIECES_CAPTURED_UI_SETTINGS$1.PIECES_SIZE
};



//****** assert, document
let Game$1 = class Game {
    //Game State
    #playingColor = E_PieceColor$1.White;
    #gameState = E_GameState$1.PLAYING;

    get playingColor() {
        return this.#playingColor;
    }
    get state() {
        return this.#gameState;
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
    #graphics;
    #position;

    /**
     * Creates a new chess game
     * @param {number} xPosition x position of game in canvas
     * @param {number} yPosition y position of game in canvas
     * @param {string} inputFen FEN of board
     * @param {E_PieceColor} playingColor Color that starts playing
     */
    constructor(xPosition, yPosition, inputFen = STANDARD_BOARD_FEN, playingColor = E_PieceColor$1.White) {
        this.#graphics = createGraphics(GAME_DIMENSIONS.WIDTH, GAME_DIMENSIONS.HEIGHT);
        this.#position = { x: xPosition, y: yPosition };

        this.#board = new Board$1(inputFen);
        this.#playingColor = playingColor;
        this.#legalMoves = this.#board.generateMoves(playingColor);

        this.#moveInput = new MoveInput$1(this.#board, xPosition + BOARD_LOCAL_POSITION$1.x, yPosition + BOARD_LOCAL_POSITION$1.y);
        this.#moveInputUI = new MoveInputUI(this, this.#moveInput);
        this.#moveInput.addInputEventListener(MoveInput$1.inputEvents.onMoveInput, this.#onMoveInput.bind(this));

        this.#moveRecord = new MoveRecord$1();
        this.#moveRecordUI = new MoveRecordUI(this.#moveRecord);
        this.#piecesCapturedUI = new PiecesCapturedUI(this.#board);
        this.#gameStateUI = new GameStateUI(this);
        this.#createResignButton();
    }

    isGameFinished() {
        return this.#gameState !== E_GameState$1.PLAYING;
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

    draw() {
        this.#graphics.background(255);

        this.#moveRecordUI.draw(this.#graphics);
        this.#piecesCapturedUI.draw(this.#graphics);
        this.#gameStateUI.draw(this.#graphics);

        this.#moveInputUI.draw(this.#graphics);
        this.#board.draw(this.#graphics);

        this.#drawRanksAndFiles(this.#graphics);

        image(this.#graphics, this.#position.x, this.#position.y);
    }


    #onMoveInput(event) {
        //if game is finished, disable input
        if (this.isGameFinished()) return;
        //get input move
        let inputMove = event.detail.move;

        //if input move is legal
        let result = this.isMoveLegal(inputMove);
        if (result.isLegal) {
            let legalMove = result.move;
            //record move
            this.#moveRecord.recordMove(legalMove, this.#board, this.#playingColor);
            //make move on board
            this.#board.makeMove(legalMove);
            //switch playing color
            this.#switchPlayingColor();
            //generate new set of legal moves
            this.#legalMoves = this.#board.generateMoves(this.#playingColor);
            //check for end game conditions
            this.#checkEndGame();
        }
    }

    #switchPlayingColor() {
        this.#playingColor = OppositePieceColor(this.#playingColor);
    }

    #checkEndGame() {
        //if there are no moves left
        if (this.#legalMoves.length === 0) {
            //and king is in check
            if (this.#board.isKingInCheck(this.#playingColor)) {
                //game finished by checkmate
                this.#gameState = E_GameState$1.CHECKMATE;
            }
            else {
                //game finished by stalemate
                this.#gameState = E_GameState$1.STALEMATE;
            }
        }
    }

    #checkDraw() {
    }

    #createResignButton() {
        let button = createButton(RESIGN_BUTTON_UI_SETTINGS.TEXT);
        button.position(this.#position.x + RESIGN_BUTTON_UI_SETTINGS.POSITION.x, this.#position.y + RESIGN_BUTTON_UI_SETTINGS.POSITION.y);
        button.mouseClicked(() => {
            this.#gameState = E_GameState$1.RESIGNED;
            button.hide();
        });
    }

    #drawRanksAndFiles(graphics) {
        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.RANKS,
            {
                x: BOARD_LOCAL_POSITION$1.x - RANKS_FILES_UI_SETTING.CELL_LENGTH,
                y: BOARD_LOCAL_POSITION$1.y,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0

            });

        graphics.drawQuadrille(
            RANKS_FILES_UI_SETTING.FILES,
            {
                x: BOARD_LOCAL_POSITION$1.x,
                y: BOARD_LOCAL_POSITION$1.y + BOARD_HEIGHT,
                cellLength: RANKS_FILES_UI_SETTING.CELL_LENGTH,
                textZoom: RANKS_FILES_UI_SETTING.TEXT_ZOOM,
                textColor: color(RANKS_FILES_UI_SETTING.TEXT_COLOR),
                outlineWeight: 0
            });
    }

};

exports.GAME_DIMENSIONS = GAME_DIMENSIONS;
exports.default = Game$1;
