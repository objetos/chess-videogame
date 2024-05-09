import SlidingPiece from "./SlidingPiece";
import { E_PieceType } from "../../Enums/E_PieceType.js";
import { E_PieceColor } from "../../Enums/E_PieceColor";
import { getRank, getFile } from "../../Utils/BitboardUtils.js";
export default class Rook extends SlidingPiece {

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