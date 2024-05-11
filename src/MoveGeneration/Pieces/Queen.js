import SlidingPiece from "./SlidingPiece.js";
import { E_PieceType } from "../../Enums/E_PieceType.js";
import { getRank, getFile, getDiagonal, getAntiDiagonal } from "../../Utils/BitboardUtils.js";

export default class Queen extends SlidingPiece {

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