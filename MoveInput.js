class MoveInput extends EventTarget {
    #inputListener;
    #board;

    #moveStart = null;
    #moveDestination = null;

    static E_InputEvents = {
        MoveInput: "user:move-input",
        SquareSelected: "user:square-selected",
        MoveCanceled: "system:move-canceled",
        MoveStartSet: "user:move-start-set",
        MoveDestinationSet: "user:move-destination-set"
    }

    constructor(board, globalBoardPositionX, globalBoardPositionY) {
        assert(board instanceof Board, "Invalid board");
        super();
        this.#inputListener = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        this.#board = board;
        select('canvas').mouseClicked(() => {
            this.#handleClick(mouseX, mouseY, globalBoardPositionX, globalBoardPositionY);
        });
    }

    addInputEventListener(event, callback) {
        assert(Object.values(MoveInput.E_InputEvents).includes(event), "Invalid event");
        this.addEventListener(event, callback);
    }

    #handleClick(clickX, clickY, boardPositionX, boardPositionY) {
        if (this.#inputListener === undefined) return;

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
            if (this.#moveStart !== null) {
                //cancel it
                this.#CancelMove();
            }
            return;
        }

        //notify that a square was selected
        let squareSelected = new CustomEvent(MoveInput.E_InputEvents.SquareSelected, { detail: { square: clickedSquare } })
        this.dispatchEvent(squareSelected);

        //if move start is not set and a piece was selected
        let pieceSelected = this.#board.getPieceOnRankFile(clickedRank, clickedFile) !== null;
        if (this.#moveStart === null && pieceSelected) {

            //set this square as the move start
            this.#moveStart = {
                rank: clickedRank,
                file: clickedFile
            }
            let moveStartSet = new CustomEvent(MoveInput.E_InputEvents.MoveStartSet, { detail: { square: clickedSquare } })
            this.dispatchEvent(moveStartSet);

            return;
        }

        //if move start is set and destination is not
        if (this.#moveStart !== null && this.#moveDestination === null) {
            //if start square and destination square are the same
            if ((this.#moveStart.rank === clickedRank && this.#moveStart.file === clickedFile)) {
                //cancel move
                this.#CancelMove();
                return;
            }

            //set this square as the move destination
            this.#moveDestination = {
                rank: clickedRank,
                file: clickedFile
            }
            let moveDestinationSet = new CustomEvent(MoveInput.E_InputEvents.MoveDestinationSet, { detail: { square: clickedSquare } })
            this.dispatchEvent(moveDestinationSet);

            //--create move
            let inputMove = new Move(this.#moveStart.rank, this.#moveStart.file, this.#moveDestination.rank, this.#moveDestination.file);
            //--notify
            let moveInput = new CustomEvent(MoveInput.E_InputEvents.MoveInput, { detail: { move: inputMove } });
            this.dispatchEvent(moveInput);
            //--unset start and destination
            this.#moveStart = null;
            this.#moveDestination = null;
        }
    }

    #CancelMove() {
        this.#moveStart = null;
        this.#moveDestination = null;
        let moveCanceled = new CustomEvent(MoveInput.E_InputEvents.MoveCanceled);
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



