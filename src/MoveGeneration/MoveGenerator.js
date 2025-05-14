/*
LINK TO FILE IN GITHUB: https://github.com/objetos/chess-videogame/blob/master/src/MoveGeneration/MoveGenerator.js 

Created for Chess.js
Play here: https://objetos.github.io/chess-thesis-website/play-chess/
Github project: https://github.com/objetos/chess-videogame

DESCRIPTION:
Generates legal moves based on the state of the board. Special rules (castling, enpassant, promotion) 
and king safety are implemented in this class. Basic rules for moving pieces are implemented by the Piece.js
abstract class and its drived classes.

Most calculations are done with the use of bitboards.

You can find a in-depth explanation of this class design and algorithms on the following devlogs:
- Code Architecture (https://objetos.github.io/chess-thesis-website/devlogs/fourth-devlog/)
- Special Rules: En-passant (https://objetos.github.io/chess-thesis-website/devlogs/eight-devlog/)
- Special Rules: Castling (https://objetos.github.io/chess-thesis-website/devlogs/ninth-devlog/)
- Generating Legal Moves Part 1 (https://objetos.github.io/chess-thesis-website/devlogs/tenth-devlog/)
- Generating Legal Moves Part 2 (https://objetos.github.io/chess-thesis-website/devlogs/eleventh-devlog/)

INPUT:
- Board: Instance of BoardImplementation.js class.
- Piece color: Piece color from E_PieceColor enum.

OUTPUT:
- Array of legal moves. Moves are instances of Move.js class.

ASSUMPTIONS:
- The board configuration provided is reachable through a sequence of legal moves

Created by Juan David Diaz Garcia. 
LinkedIn: https://www.linkedin.com/in/juan-david-diaz-garcia-8b72781b0/   
Github profile: https://github.com/D4vidDG 
Email: jdiazga@unal.edu.co 
*/

//------ IMPORTS
import { assert, assertPieceColor } from "../../Testing/TestTools.js";
import { E_PieceColor } from "../Enums/E_PieceColor.js";
import { E_PieceType } from "../Enums/E_PieceType.js";
import { E_MoveFlag } from "../Enums/E_MoveFlag.js";
import { OppositePieceColor, ENPASSANT_CAPTURING_RANKS, CASTLING_FILES } from "../Utils/ChessUtils.js";
import { getRay, hyperbolaQuintessenceAlgorithm, getBooleanBitboard, printBitboard } from "../Utils/BitboardUtils.js";
import { NUMBER_OF_FILES } from "../Utils/ChessUtils.js";
import BoardImplementation from "../Board/BoardImplementation.js";
import Move from "./Move.js";
import { E_CastlingSide } from "../Enums/E_CastlingSide.js";
import Castling from "./Castling.js";
import Promotion from "./Promotion.js";
//------

export default class MoveGenerator {

    /**
     * Generates a set of legal moves given a board configuration and a piece color
     * @param {BoardImplementation} board 
     * @param {E_PieceColor} inputColor
     * @returns {Move[]} Array of legal moves of pieces of given color
     */
    generateMoves(board, pieceColor) {

        assert(board instanceof BoardImplementation, "Invalid board");
        assertPieceColor(pieceColor);
        let inputColor = pieceColor;

        let legalMoves = [];
        let playingPieces = board.getPiecesOfType(inputColor, E_PieceType.Any);
        let enemyPieces = board.getPiecesOfType(OppositePieceColor(inputColor), E_PieceType.Any);

        //-- CALCULATIONS FOR KING SAFETY --
        let king = board.getPiecesOfType(inputColor, E_PieceType.King)[0];
        let squaresToPreventCheck = getBooleanBitboard(true);// Bitboard with squares that prevent check by blocking the checkers path or by capturing the checker.
        let pinnedPieces = {};// Dictionary with pieces that are pinned. Key is the piece position and value is the squares the piece can move to without discovering a check

        //if there is a king 
        if (king !== undefined) {
            let checkers = this.#calculateCheckers(king, enemyPieces, board);
            let kingSafeMoves = this.#generateKingSafeMoves(king, enemyPieces, board);

            //if there's more than one checker
            if (1 < checkers.length) {
                //the only legal moves are king safe moves
                return kingSafeMoves;
            } //else if there is just 1 checker
            else if (checkers.length === 1) {
                //calculate squares that can block the check or capture checker
                squaresToPreventCheck = this.#calculateSquaresToPreventCheck(king, checkers[0], board);
            }

            pinnedPieces = this.#calculatePinnedPieces(king, enemyPieces, board);

            //add king moves to the list of legal moves
            legalMoves = legalMoves.concat(kingSafeMoves);
        }

        //-- REGULAR MOVES AND PROMOTION--
        //calculate regular move of every piece of the input color
        for (let piece of playingPieces) {
            //exclude calculation for king
            if (piece.GetType() === E_PieceType.King) continue;

            //get bitboard with regular moves
            let pieceMovesBitboard = piece.GetMoves(board);
            //filter moves that do not prevent king check
            pieceMovesBitboard = pieceMovesBitboard & squaresToPreventCheck;
            //if piece is pinned
            let isPiecePinned = pinnedPieces[piece.position] !== undefined;
            if (isPiecePinned) {
                //filter moves that discover a check
                let pinnedPieceSafeSquares = pinnedPieces[piece.position];
                pieceMovesBitboard = pieceMovesBitboard & pinnedPieceSafeSquares;
            }

            //if a pawn is about to promote
            if (piece.GetType() === E_PieceType.Pawn && piece.isBeforePromotingRank()) {
                //add pawn moves as promotion moves
                let promotionsMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Promotion);
                legalMoves = legalMoves.concat(promotionsMoves);
            }// else if piece is not a pawn or the pawn is not promoting
            else {
                // add regular piece moves
                let pieceMoves = this.#bitboardToMoves(piece, pieceMovesBitboard, E_MoveFlag.Regular);
                legalMoves = legalMoves.concat(pieceMoves);
            }
        }

        //-- EN-PASSANT --
        let pawns = board.getPiecesOfType(inputColor, E_PieceType.Pawn);
        let enPassantMoves = this.#generateEnPassantMoves(pawns, board);
        legalMoves = legalMoves.concat(enPassantMoves);

        //-- CASTLING --
        let rooks = board.getPiecesOfType(inputColor, E_PieceType.Rook);
        let castlingMoves = this.#generateCastlingMoves(king, rooks, board);
        legalMoves = legalMoves.concat(castlingMoves);

        return legalMoves;
    }

    /**
     * Calculate enemy pieces that are checking the king
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
     * Generates moves for the king that do not put it in check
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Array of moves the king can do safely
     */
    #generateKingSafeMoves(king, enemyPieces, board) {
        let dangerousSquaresForKing = 0n; //bitboard of squares that put the king in check

        // remove king temporarily to consider squares behind the king
        board.removePiece(king.rank, king.file);
        //king cannot move to sqaures attacked by the enemy
        let squaresAttackedByEnemy = board.getAttackedSquares(OppositePieceColor(king.color));
        //protected pieces cannot be captured
        let dangerouseCaptures = this.#calculateProtectedPieces(enemyPieces, board);
        //add king back to the board
        board.addPiece(king, king.rank, king.file);

        //filter dangerous sqaures from king regular moves
        dangerousSquaresForKing = dangerouseCaptures | squaresAttackedByEnemy;
        let kingMovesBitboard = king.GetMoves(board) & ~dangerousSquaresForKing;

        return this.#bitboardToMoves(king, kingMovesBitboard, E_MoveFlag.Regular);
    }

    /**
     * Determines what enemy pieces are being protected (i.e the enemy can recapture if they are captured)
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Bitboard with the position of protected pieces
     */
    #calculateProtectedPieces(enemyPieces, board) {
        if (enemyPieces.length == 0) return;
        let protectedPieces = 0n;
        let squaresOccupiedByEnemyPieces = board.getOccupied(enemyPieces[0].color);
        //for every enemy piece
        for (let enemyPiece of enemyPieces) {
            //if it is a slider
            if (enemyPiece.IsSlider()) {
                //calculate moves normally
                let slider = enemyPiece;
                let occupied = board.getOccupied();
                let rays = slider.getSlidingRays();
                let position = slider.position;
                let slidingMoves = 0n;

                rays.forEach(ray => {
                    let movesInRay = hyperbolaQuintessenceAlgorithm(occupied, position, ray);
                    slidingMoves = slidingMoves | movesInRay.wholeRay;
                });
                //protected pieces are where this piece could move to if there was an enemy piece 
                protectedPieces |= slidingMoves & squaresOccupiedByEnemyPieces;
            }
            //else if it is a pawn
            else if (enemyPiece.GetType() === E_PieceType.Pawn) {
                let pawn = enemyPiece;
                //calculate sqaures where the pawn captures
                let pawnCapturingSquares = pawn.GetCapturingSquares();
                //protected pieces are where this pawn could capture if there was an enemy piece 
                protectedPieces |= pawnCapturingSquares & squaresOccupiedByEnemyPieces;

            }
            //else if it is a knight or a king
            else if (enemyPiece.GetType() === E_PieceType.Knight | enemyPiece.GetType() === E_PieceType.King) {
                //calculate moves in an empty board
                let emptyBoard = new BoardImplementation(new Quadrille('8/8/8/8/8/8/8/8'));
                let enemyMovesInEmptyBoard = enemyPiece.GetMoves(emptyBoard);
                //protected pieces are where this piece could move to if there was an enemy piece 
                protectedPieces |= enemyMovesInEmptyBoard & squaresOccupiedByEnemyPieces;
            }
        }

        return protectedPieces;

    }

    /**
     * Calculates squares that allow to prevent a check
     * @param {King} king 
     * @param {Piece} checker 
     * @returns Bitboard with squares that pieces can move to in order to avoid the check
     */
    #calculateSquaresToPreventCheck(king, checker) {
        //if checker is a slider
        if (checker.IsSlider()) {
            //we can block the check by moving to any square between the slider and the king or capturing the slider.
            //return ray from the checker to the king including the start square
            return getRay(checker.rank, checker.file, king.rank, king.file, true, false);
        }
        //else if piece is not a slider
        else {
            //we can avoid the check only by capturing the checker
            return checker.position;
        }
    }

    /**
     * Calculates pinned pieces and determines the squares thye can move to
     * @param {King} king 
     * @param {Piece[]} enemyPieces 
     * @param {BoardImplementation} board 
     * @returns Dictionary of pinned pieces. 
     * Key is a bitboard with the position of a pinned piece.
     * Value is a bitboard with the squares it can move to without discovering a check.
     */
    #calculatePinnedPieces(king, enemyPieces, board) {
        let pinnedPieces = {};

        //calculate if any enemy piece is pinning pieces
        for (let enemyPiece of enemyPieces) {
            //if it is not a slider, it cannot pin pieces
            if (!enemyPiece.IsSlider()) continue;

            let slider = enemyPiece;
            let sliderRays = slider.getSlidingRays();
            let rayFromSliderToKing = getRay(slider.rank, slider.file, king.rank, king.file, false, true);

            //if there's no possible ray between slider and king, king is not within slider's attack range, continue.
            if (rayFromSliderToKing === 0n) continue;

            //determine if slider is allowed to move on a ray to the king
            let isSliderAllowedToMoveOnRay = false;
            for (let ray of sliderRays) {
                if ((ray & rayFromSliderToKing) > 0n) {
                    isSliderAllowedToMoveOnRay = true;
                }
            }

            //if slider is not allowed to move on the ray to the king, king is not within slider's attack range, do nothing. 
            if (!isSliderAllowedToMoveOnRay) continue;

            //check for pinned pieces. Algorithm taken from https://www.chessprogramming.org/Checks_and_Pinned_Pieces_(Bitboards)
            let occupied = board.getOccupied();
            let attacksFromSliderToKing = hyperbolaQuintessenceAlgorithm(occupied, slider.position, rayFromSliderToKing);
            let attacksFromKingToSlider = hyperbolaQuintessenceAlgorithm(occupied, king.position, rayFromSliderToKing);
            let emptySpaceBetweenKingAndSlider = rayFromSliderToKing & ~king.position;
            let intersection = attacksFromKingToSlider.wholeRay & attacksFromSliderToKing.wholeRay;

            //if there's no intersection
            if (intersection === 0n) {

                //Option 1. there are two or more pieces in between slider and king. Therefore, there are not pinned pieces.
                //Option 2. slider is besides the king and checking it. Slider is not pinning pieces.

            }
            //else if the intersection is equal to empty spaces
            else if ((intersection & board.getEmptySpaces()) === emptySpaceBetweenKingAndSlider) {

                //there's no pieces in between slider and king. Slider is cheking the king from the distance.

            } else {
                //there's one piece in between slider and king in the intersection
                //if the piece is an ally
                let isPieceAnAlly = (intersection & board.getOccupied(king.color)) > 0n;
                if (isPieceAnAlly) {
                    //piece is being pinned by the slider.
                    let pinnedPosition = intersection;
                    //piece can only move in the ray from the slider to the king to avoid discovering a check
                    let legalSquares = rayFromSliderToKing | slider.position;
                    //add pinned piece position and squares to dictionary
                    pinnedPieces[pinnedPosition] = legalSquares;
                }
            }
        }
        return pinnedPieces;
    }

    /**
     * Generates en-passant moves of a set of pawns
     * @param {Pawn[]} pawns Pawns of the same color
     * @param {BoardImplementation} board 
     * @returns Array of en passant moves
     */
    #generateEnPassantMoves(pawns, board) {
        let enPassantMoves = [];
        let enPassantInfo = board.getEnPassantInfo();//tells if an en-passant capture is possible and where
        //calculate en-passant for every pawn
        for (let capturingPawn of pawns) {
            //The en passant capture must be performed on the turn immediately after the enemy pawn moves.
            if (enPassantInfo.rightToEnPassant === false) continue;

            //The capturing pawn must have advanced exactly three ranks to perform this move.
            if (capturingPawn.rank !== ENPASSANT_CAPTURING_RANKS[capturingPawn.color]) continue;

            //The captured pawn must be on the same rank and one file apart from the capturing pawn. 
            let rankDiff = Math.abs(enPassantInfo.captureRank - capturingPawn.rank);
            let fileDiff = Math.abs(enPassantInfo.captureFile - capturingPawn.file);
            if (fileDiff !== 1 || rankDiff !== 0) continue;

            /* Generate en-passant move.The capturing pawn moves diagonally to an adjacent square, 
            one rank farther from where it was, and on the same file where the captured pawn is.*/
            let targetRank = capturingPawn.color === E_PieceColor.White ?
                capturingPawn.rank + 1 : capturingPawn.rank - 1;
            let enPassant = new Move(capturingPawn.rank, capturingPawn.file, targetRank, enPassantInfo.captureFile, E_MoveFlag.EnPassant);

            //en passant move must be legal
            if (!this.#isEnPassantLegal(capturingPawn.color, enPassant, board)) continue;

            //if legal, add en-passant move
            enPassantMoves.push(enPassant);
        }

        return enPassantMoves;
    }

    /**
     * Checks if an en passant move is legal. Algorithm taken from: https://peterellisjones.com/posts/generating-legal-chess-moves-efficiently/
     * @param {E_PieceColor} playingColor 
     * @param {Move} enPassant En-passant move
     * @param {BoardImplementation} board 
     * @returns Whether the en-passant move is legal or not
     */
    #isEnPassantLegal(playingColor, enPassant, board) {
        let capturedPawnRank = enPassant.startRank;
        let capturedPawnFile = enPassant.endFile;
        let capturingPawnRank = enPassant.startRank;
        let capturingPawnFile = enPassant.startFile;

        //check is king is currently in check
        let inCheckBeforeEnPassant = board.isKingInCheck(playingColor);

        //simulate making the en-passant capture by removing both pieces
        let capturedPawn = board.removePiece(capturedPawnRank, capturedPawnFile);
        let capturingPawn = board.removePiece(capturingPawnRank, capturingPawnFile);

        //check if king is in check after making the en-passant capture
        let inCheckAfterEnPassant = board.isKingInCheck(playingColor);

        //add removed pawns
        board.addPiece(capturedPawn, capturedPawnRank, capturedPawnFile);
        board.addPiece(capturingPawn, capturingPawnRank, capturingPawnFile);

        if (!inCheckBeforeEnPassant & !inCheckAfterEnPassant) {
            //en-passant is legal
            return true;
        } else if (inCheckBeforeEnPassant && !inCheckAfterEnPassant) {
            //en-passant blocks a check or captures pawn that was checking. Therefore, it is legal
            return true;
        } else if (!inCheckBeforeEnPassant & inCheckAfterEnPassant) {
            //en-passant discovers a check. Therefore, it is illegal
            return false;
        } else if (inCheckBeforeEnPassant & inCheckAfterEnPassant) {
            //en-passant discovered another check or en-passant move does not prevent the check. Therefore, it is illegal
            return false;
        }
    }

    /**
     * Generates castling moves of rooks
     * @param {King} king 
     * @param {Rook[]} rooks 
     * @param {BoardImplementation} board 
     * @returns Array of castling moves
     */
    #generateCastlingMoves(king, rooks, board) {
        //if there are no rooks or no king, castling is not possible
        if (king === undefined) return [];
        if (rooks === undefined || rooks.length === 0) return [];

        //if the the king is in check, castling is not possible
        if (board.isKingInCheck(king.color)) return [];

        //if the king is not on its initial square, castling is not possible
        if (!king.isOnInitialSquare()) return [];

        let castlingMoves = [];
        //calculate if any rook can castle with the king
        for (let rook of rooks) {
            //if rook is not on its initial square, it cannot castle
            if (!rook.isOnInitialSquare()) continue;

            /*This side must have castling rights. That is, rooks cannot have moved 
            or been captured previously. Also, king cannot have moved before.*/
            let castlingSide = king.file > rook.file ? E_CastlingSide.QueenSide : E_CastlingSide.KingSide;
            if (!board.hasCastlingRights(rook.color, castlingSide)) continue;

            //calculate path from king to rook
            let pathFromKingToRook = castlingSide === E_CastlingSide.QueenSide ?
                king.position << 1n | king.position << 2n | king.position << 3n :
                king.position >> 1n | king.position >> 2n;

            //there cannot be any piece between the rook and the king
            let isCastlingPathObstructed = (board.getEmptySpaces() & pathFromKingToRook) !== pathFromKingToRook;
            if (isCastlingPathObstructed) continue;

            //calculate the path the king takes to castle
            let kingPathToCastle = castlingSide === E_CastlingSide.QueenSide ?
                king.position << 1n | king.position << 2n :
                king.position >> 1n | king.position >> 2n;
            //the king cannot pass through check when castling
            let attackedSquares = board.getAttackedSquares(OppositePieceColor(king.color));
            let isKingPathChecked = (kingPathToCastle & attackedSquares) > 0n;
            if (isKingPathChecked) continue;

            //The rook can castle with the king. create castling move
            let kingTargetFile = CASTLING_FILES[castlingSide][E_PieceType.King].endFile;
            let kingMove = new Castling(king.rank, king.file, king.rank, kingTargetFile, castlingSide);
            //add castling move 
            castlingMoves.push(kingMove);
        }

        return castlingMoves;
    }


    /**
     * Converts bitboard into a set of moves. The start square is the piece position and the destination is
     * the position of every on-bit of the bitboard. The move flag is assigned to every move.
     * @param {Piece} piece 
     * @param {bigint} bitboard 
     * @param {E_MoveFlag} moveFlag 
     * @returns  Array of moves with given flag
     */
    #bitboardToMoves(piece, bitboard, moveFlag) {
        let moves = [];
        let testBit = 1n; //bit used to traverse the bitboard

        //if no bits are set, return no moves
        if (bitboard === 0n) return [];
        //for each bit
        for (let index = 0; index < 64; index++) {
            //if bit is on
            if (0n < (bitboard & testBit)) {
                //calculate destination rank and file
                let endRank = Math.floor((index) / NUMBER_OF_FILES) + 1;
                let endFile = NUMBER_OF_FILES - (index % NUMBER_OF_FILES);

                //create move
                let newMove;
                if (moveFlag === E_MoveFlag.Promotion) {
                    newMove = new Promotion(piece.rank, piece.file, endRank, endFile);
                } else if (moveFlag === E_MoveFlag.Castling) {
                    newMove = new Castling(piece.rank, piece.file, endRank, endFile);
                } else {
                    newMove = new Move(piece.rank, piece.file, endRank, endFile, moveFlag);
                }

                //add move to array
                moves.push(newMove);
            }

            //continue to next bit
            testBit = testBit << 1n;
        }

        return moves;
    }
}
