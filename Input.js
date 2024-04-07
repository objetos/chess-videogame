class Input extends EventTarget {
    static #board;
    static #inputMoveStart = null;
    static #inputMoveDestination = null;
    static E_InputEvents = {
        MoveInput: "user:move-input",
        SquareSelected: "user:square-selected"
    }

    //Singleton pattern
    static #_instance;
    static get #instance() {
        if (!Input.#_instance) {
            Input.#_instance = new Input();
        }
        return Input.#_instance;
    }

    constructor() {
        super();
        if (!Input.#_instance) {
            Input.#_instance = this;
        }
        // Initialize object
        return Input.#_instance
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

    static #onClick() {
        if (this.#board === undefined) return;
        //get row and column
        let clickedRank = 8 - this.#board.mouseRow;
        let clickedFile = this.#board.mouseCol + 1;

        //check that click is within board limits
        if (clickedRank < 1 || 8 < clickedRank || clickedFile < 1 || 8 < clickedFile) return;

        //notify a square was selected
        let onSquareSelected = new CustomEvent(this.E_InputEvents.SquareSelected, { detail: { square: { rank: clickedRank, file: clickedFile } } })
        this.#instance.dispatchEvent(onSquareSelected);

        //if the start of the move is not set
        if (this.#inputMoveStart === null) {
            //if the square is not empty, set this square as the move start
            this.#inputMoveStart = {
                rank: clickedRank,
                file: clickedFile
            }
        } else {
            if ((this.#inputMoveStart.rank === clickedRank && this.#inputMoveStart.file === clickedFile)) return;
            //set this square as the move destination
            this.#inputMoveDestination = {
                rank: clickedRank,
                file: clickedFile
            }
        }

        //if move start and destination is set
        if (this.#inputMoveStart !== null && this.#inputMoveDestination !== null) {
            //--create move
            let inputMove = new Move(this.#inputMoveStart.rank, this.#inputMoveStart.file, this.#inputMoveDestination.rank, this.#inputMoveDestination.file);
            //--notify
            let onMoveInput = new CustomEvent(this.E_InputEvents.MoveInput, { detail: { move: inputMove } });
            this.#instance.dispatchEvent(onMoveInput);
            //--unset start and destination
            this.#inputMoveStart = null;
            this.#inputMoveDestination = null;
        }
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
    Input.handleInputEvent(event);
}

