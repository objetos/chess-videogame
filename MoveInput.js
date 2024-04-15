class MoveInput extends EventTarget {
    static #inputListener;
    static #board;

    static #moveStart = null;
    static #moveDestination = null;

    static E_InputEvents = {
        MoveInput: "user:move-input",
        SquareSelected: "user:square-selected",
        MoveCanceled: "system:move-canceled",
        MoveStartSet: "user:move-start-set",
        MoveDestinationSet: "user:move-destination-set"
    }

    //Singleton pattern
    static #_instance;
    static get #instance() {
        if (!MoveInput.#_instance) {
            MoveInput.#_instance = new MoveInput();
        }
        return MoveInput.#_instance;
    }

    constructor() {
        super();
        if (!MoveInput.#_instance) {
            MoveInput.#_instance = this;
        }
        // Initialize object
        return MoveInput.#_instance
    }

    /**
     * Set board that receives input events 
     * @param {Board} board 
     */
    static setBoard(board) {
        assert(board instanceof Board, "Invalid board");
        this.#inputListener = createQuadrille(NUMBER_OF_FILES, NUMBER_OF_RANKS);
        this.#board = board;
    }

    static addInputEventListener(event, callback) {
        assert(Object.values(this.E_InputEvents).includes(event), "Invalid event");
        this.#instance.addEventListener(event, callback);
    }

    static handleInputEvent(event) {
        if (event instanceof UIEvent && event.type === "click") {
            this.#onClick(event);
        }
    }

    static #onClick(event) {//****** deny if there's no piece on move start
        if (this.#inputListener === undefined) return;

        //get click coordinates relative to page
        let xCoordinate = event.pageX;
        let yCoordinate = event.pageY;
        //get clicked square
        let clickedRank = 8 - this.#inputListener.screenRow(yCoordinate, BOARD_POSITION.y, BOARD_SQUARE_SIZE);
        let clickedFile = this.#inputListener.screenCol(xCoordinate, BOARD_POSITION.x, BOARD_SQUARE_SIZE) + 1;
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
        let squareSelected = new CustomEvent(this.E_InputEvents.SquareSelected, { detail: { square: clickedSquare } })
        this.#instance.dispatchEvent(squareSelected);

        //if move start is not set and a piece was selected
        let pieceSelected = this.#board.getPieceOnRankFile(clickedRank, clickedFile) !== null;
        if (this.#moveStart === null && pieceSelected) {

            //set this square as the move start
            this.#moveStart = {
                rank: clickedRank,
                file: clickedFile
            }
            let moveStartSet = new CustomEvent(this.E_InputEvents.MoveStartSet, { detail: { square: clickedSquare } })
            this.#instance.dispatchEvent(moveStartSet);

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
            let moveDestinationSet = new CustomEvent(this.E_InputEvents.MoveDestinationSet, { detail: { square: clickedSquare } })
            this.#instance.dispatchEvent(moveDestinationSet);

            //--create move
            let inputMove = new Move(this.#moveStart.rank, this.#moveStart.file, this.#moveDestination.rank, this.#moveDestination.file);
            //--notify
            let moveInput = new CustomEvent(this.E_InputEvents.MoveInput, { detail: { move: inputMove } });
            this.#instance.dispatchEvent(moveInput);
            //--unset start and destination
            this.#moveStart = null;
            this.#moveDestination = null;
        }
    }

    static #CancelMove() {
        this.#moveStart = null;
        this.#moveDestination = null;
        let moveCanceled = new CustomEvent(this.E_InputEvents.MoveCanceled);
        this.#instance.dispatchEvent(moveCanceled);
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



function mouseClicked(event) {
    MoveInput.handleInputEvent(event);
}

