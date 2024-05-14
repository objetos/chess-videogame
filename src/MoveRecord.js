import { E_MoveFlag } from "./Enums/E_MoveFlag.js";
import { E_PieceColor } from "./Enums/E_PieceColor.js";
import { FileToLetter, OppositePieceColor, pieceColorTypeToKey } from "./Utils/ChessUtils.js";
import Move from "./MoveGeneration/Move.js";
import Board from "./Board/Board.js";
import MoveInput from "./MoveInput.js";
import Castling from "./MoveGeneration/Castling.js";
import { E_CastlingSide } from "./Enums/E_CastlingSide.js";
import { assert } from "../Testing/TestTools.js";

export default class MoveRecord extends EventTarget {
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