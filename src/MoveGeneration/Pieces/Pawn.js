import Piece from "./Piece.js";
import { E_PieceType } from "../../Enums/E_PieceType.js";
import { E_PieceColor } from "../../Enums/E_PieceColor.js";
import { getBooleanBitboard } from "../../Utils/BitboardUtils.js";
import { OppositePieceColor, RANKS_TO_PROMOTE } from "../../Utils/ChessUtils.js";
import { getRank, getFile } from "../../Utils/BitboardUtils.js";

export default class Pawn extends Piece {
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