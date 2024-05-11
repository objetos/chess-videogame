import { NUMBER_OF_RANKS, NUMBER_OF_FILES } from "../Utils/ChessUtils.js";
import { E_PieceColor } from "../Enums/E_PieceColor.js";
import { E_PieceType } from "../Enums/E_PieceType.js";
import { E_MoveFlag } from "../Enums/E_MoveFlag.js";
import { pieceColorTypeToKey, pieceKeyToColor, CASTLING_FILES } from "../Utils/ChessUtils.js";
import { assert, assertFile, assertRank, assertPieceColor } from "../../Testing/TestTools.js";
import { BOARD_LOCAL_POSITION, BOARD_SQUARE_SIZE } from "../UI/UISettings.js";
import MoveGenerator from "../MoveGeneration/MoveGenerator.js";
import BoardImplementation from "./BoardImplementation.js";
import Move from "../MoveGeneration/Move.js";
import MoveInput from "../MoveInput.js";

//******  CLASS PROLOG, ASSERT AND DOCUMENT PRIVATE METHODS
export default class Board {
    #moveGenerator;
    #boardImplementation;

    #board = new Quadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS); //board with pieces in symbol representation

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
                this.#setCastlingRights(color, E_MoveFlag.KingSideCastling, false);
                this.#setCastlingRights(color, E_MoveFlag.QueenSideCastling, false);
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
                    this.#setCastlingRights(color, E_MoveFlag.KingSideCastling, false);
                    this.#setCastlingRights(color, E_MoveFlag.QueenSideCastling, false);
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
                    let castlingSide = file === 1 ? E_MoveFlag.QueenSideCastling : E_MoveFlag.KingSideCastling;
                    this.#setCastlingRights(color, castlingSide, true);
                }
            }
        }

        //initialize board implementation
        this.#boardImplementation = new BoardImplementation(inputFen, this.#castlingRights, this.#enPassantInfo);
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
            assert(pieceInDestination.toLowerCase() !== 'k', "King capture is forbidden")
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
        let pieceKey = pieceColorTypeToKey(pieceColor, pieceTypeToPromote);
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
            CASTLING_FILES[move.flag][E_PieceType.Rook].startFile,
            move.startRank,
            CASTLING_FILES[move.flag][E_PieceType.Rook].endFile,
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
        let capture = { type: this.#E_BoardChangeType.Capture, rank: rank, file: file, piece: pieceSymbol }
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
                if (rook.isOnInitialSquare() && this.#hasCastlingRights(rook.color, rookCastlingSide)) {
                    //Remove castling rights from this rook's side
                    this.#disableCastlingRights(rook.color, rookCastlingSide);
                }
            } //else if a king is moving
            else if (pieceInStart.GetType() === E_PieceType.King) {
                let king = pieceInStart;
                //if the king has not moved before
                let hasKingMoved = !(king.isOnInitialSquare() &&
                    this.#hasCastlingRights(king.color, E_MoveFlag.KingSideCastling) &&
                    this.#hasCastlingRights(king.color, E_MoveFlag.QueenSideCastling));
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
        assertPieceColor(color);
        assert(castlingSide === E_MoveFlag.QueenSideCastling || castlingSide === E_MoveFlag.KingSideCastling, "Invalid castling side");

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
            }
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