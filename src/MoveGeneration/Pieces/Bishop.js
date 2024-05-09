import SlidingPiece from "./SlidingPiece.js";
import { E_PieceType } from "../../Enums/E_PieceType.js";
import { getDiagonal, getAntiDiagonal } from "../../Utils/BitboardUtils.js";

export default class Bishop extends SlidingPiece {


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