class MoveInput extends EventTarget {
    static #board;
    static #inputMoveStart = null;
    static #inputMoveDestination = null;
    static E_InputEvents = {
        MoveInput: "user:move-input",
        SquareSelected: "user:square-selected",
        MoveCanceled: "system:move-canceled"
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
     * @param {Quadrille} board 
     */
    static setBoard(board) {
        assert(board instanceof Quadrille, "Invalid board");
        assert(board.height === 8 && board.width === 8, "Invalid board dimensions")
        this.#board = board
    }

    static addInputEventListener(event, callback) {
        assert(Object.values(this.E_InputEvents).includes(event), "Invalid event");
        this.#instance.addEventListener(event, callback);
    }

    static handleInputEvent(event) {
        if (event instanceof UIEvent && event.type === "click") {
            this.#onClick();
        }
    }

    static #onClick() {//****** deny if there's no piece on move start
        if (this.#board === undefined) return;

        //get clicked rank and file
        let clickedRank = 8 - this.#board.mouseRow;
        let clickedFile = this.#board.mouseCol + 1;

        //if click is not within board limits
        let isClickWithinBoardLimits = 1 <= clickedRank && clickedRank <= 8 && 1 <= clickedFile && clickedFile <= 8;
        if (!isClickWithinBoardLimits) {
            //if move was started
            if (this.#inputMoveStart !== null) {
                //cancel it
                this.#CancelMove();
            }
            return;
        }

        //notify that a square was selected
        let onSquareSelected = new CustomEvent(this.E_InputEvents.SquareSelected, { detail: { square: { rank: clickedRank, file: clickedFile } } })
        this.#instance.dispatchEvent(onSquareSelected);

        //notify if a piece was selected
        let pieceSelected = this.#board.read(this.#board.mouseRow, this.#board.mouseCol) !== undefined;

        //if move start is not set
        if (this.#inputMoveStart === null && pieceSelected) {
            //set this square as the move start
            this.#inputMoveStart = {
                rank: clickedRank,
                file: clickedFile
            }
            return;
        }

        //if move start is set and destination is not
        if (this.#inputMoveStart !== null && this.#inputMoveDestination === null) {
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
            }
            //--create move
            let inputMove = new Move(this.#inputMoveStart.rank, this.#inputMoveStart.file, this.#inputMoveDestination.rank, this.#inputMoveDestination.file);
            //--notify
            let moveInput = new CustomEvent(this.E_InputEvents.MoveInput, { detail: { move: inputMove } });
            this.#instance.dispatchEvent(moveInput);
            //--unset start and destination
            this.#inputMoveStart = null;
            this.#inputMoveDestination = null;
        }
    }

    static #CancelMove() {
        this.#inputMoveStart = null;
        this.#inputMoveDestination = null;
        let moveCanceled = new CustomEvent(this.E_InputEvents.MoveCanceled);
        this.#instance.dispatchEvent(moveCanceled);
    }

    static #pieceSelectedForPromotion = E_PieceType.Queen;

    static get pieceSelectedForPromotion() {
        return this.#pieceSelectedForPromotion;
    }

    static set pieceSelectedForPromotion(value) {
        console.assert(Object.values(E_PieceType).includes(value), "Invalid piece type");
        console.assert(value !== E_PieceType.Pawn, "Promotion to Pawn is forbidden");
        console.assert(value !== E_PieceType.King, "Promotion to King is forbidden");
        this.#pieceSelectedForPromotion = value;
    }
}



function mouseClicked(event) {
    MoveInput.handleInputEvent(event);
}

