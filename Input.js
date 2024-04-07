class Input extends EventTarget {
    static #instance;
    static get instance() {
        if (!Input.#instance) {
            Input.#instance = new Input();
        }
        return Input.#instance;
    }

    constructor() {
        super();
        if (!Input.#instance) {
            Input.#instance = this;
        }
        // Initialize object
        return Input.#instance
    }

    static #boardCoordinates = {
        x: 0,
        y: 0,
    }
    static #boardSize = 40 * 8;
    static moveStart = null;
    static moveDestination = null;


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

    static addInputEventListener(event, callback) {
        Input.instance.addEventListener(event, callback);
    }

    static handleInputEvent(event) {
        if (event instanceof UIEvent && event.type === "click") {
            Input.#onClick(event);
        }
    }

    static #onClick(event) {

        //get coordinates of click in pixels
        let xCoordinate = event.x;
        let yCoordinate = event.y;

        //check that coordintaes are within board limits
        if (xCoordinate < this.#boardCoordinates.x || (this.#boardCoordinates.x + this.#boardSize) < xCoordinate) return;
        if (yCoordinate < this.#boardCoordinates.y || (this.#boardCoordinates.y + this.#boardSize) < yCoordinate) return;

        //calculate in which square this click lands
        let cellLength = this.#boardSize / 8;
        let clickedRank = 9 - Math.ceil((yCoordinate - this.#boardCoordinates.y) / cellLength);
        let clickedFile = Math.ceil((xCoordinate - this.#boardCoordinates.x) / cellLength);

        //if the start of the move is not set
        if (this.moveStart === null) {
            //if the square is not empty, set this square as the move start
            this.moveStart = {
                rank: clickedRank,
                file: clickedFile
            }
        } else {
            if ((this.moveStart.rank === clickedRank && this.moveStart.file === clickedFile)) return;
            //set this square as the move destination
            this.moveDestination = {
                rank: clickedRank,
                file: clickedFile
            }
        }

        //if move start and destination is set
        if (this.moveStart !== null && this.moveDestination !== null) {
            //--create move
            let inputMove = new Move(this.moveStart.rank, this.moveStart.file, this.moveDestination.rank, this.moveDestination.file);
            //--notify
            let onMoveInput = new CustomEvent("user:move-input", { detail: { move: inputMove } })
            Input.instance.dispatchEvent(onMoveInput);
            //--unset start and destination
            this.moveStart = null;
            this.moveDestination = null;
        }
    }
}



function mouseClicked(event) {
    Input.handleInputEvent(event);
}

