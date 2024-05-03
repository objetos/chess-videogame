const FIRST_FILE_BITBOARD = 0x0101010101010101n;
const FIRST_RANK_BITBOARD = 0xFFn;

/**
 * 
 * @param {Number} rank 
 * @param {Number} file 
 * @returns Bitboard that holds the square given by rank and file
 */
function squareToBitboard(rank, file) {
    assertRank(rank);
    assertFile(file);
    //move to file
    let bitboard = 1n << BigInt(NUMBER_OF_FILES - file);
    //move to rank
    bitboard = bitboard << BigInt((rank - 1) * NUMBER_OF_RANKS);
    return bitboard;
}

/**
 * 
 * @param {Number} startRank 
 * @param {Number} startFile 
 * @param {Number} destinationRank 
 * @param {Number} destinationFile 
 * @param {boolean} includeStart Should the ray contain the start square?
 * @param {boolean} includeDestination Should the ray contain the destination square?
 * @returns Bitboard that holds a ray from given start and end square  
 */
function getRay(startRank, startFile, destinationRank, destinationFile, includeStart = true, includeDestination = true) {
    assertRank(startRank);
    assertRank(destinationRank);
    assertRank(startFile);
    assertFile(destinationFile);
    assert(typeof includeStart === 'boolean', "includeStart is not boolean");
    assert(typeof includeStart === 'boolean', "includeDestination is not boolean");

    let start = squareToBitboard(startRank, startFile);
    let destination = squareToBitboard(destinationRank, destinationFile);

    //if start and destination are the same
    if (startRank === destinationRank && startFile === destinationFile) {
        if (includeStart || includeDestination) return start;//return start or destination if included 
        else return 0n; //else return empty ray
    }

    let rankDiff = destinationRank - startRank;
    let fileDiff = destinationFile - startFile;
    let isPositiveRay = false;
    let mask = 0n;

    if (startRank === destinationRank) {
        //horizontal ray
        mask = getRank(startRank);
        isPositiveRay = destinationFile < startFile;
    } else if (startFile === destinationFile) {
        //vertical ray
        mask = getFile(startFile);
        isPositiveRay = startRank < destinationRank;
    } else if (Math.abs(rankDiff) === Math.abs(fileDiff)) {
        //diagonal ray
        let isDiagonal = Math.sign(rankDiff) === Math.sign(fileDiff);
        if (isDiagonal) {
            mask = getDiagonal(startRank, startFile);
            isPositiveRay = 0 < rankDiff && 0 < fileDiff;
        } else {
            mask = getAntiDiagonal(startRank, startFile);
            isPositiveRay = 0 < rankDiff && fileDiff < 0;
        }
    } else {
        //no ray is possible
        return 0n;
    }

    let rays = hyperbolaQuintessenceAlgorithm(destination, start, mask);
    let ray = isPositiveRay ? rays.positiveRay : rays.negativeRay;

    if (includeStart) ray = ray | start;
    if (!includeDestination) ray = ray & ~destination;

    return ray;
}

/**
 * Calculates a sliding ray from given position to any square blocked by occupied in the direction of mask.
 * Calculates usign o^(o-2r) trick. 
 * Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.
 * @param {*} occupied Bitboard with occupied squares
 * @param {*} position Bitboard with position of piece
 * @param {*} mask Bitboard with sliding direction
 * @returns Bitboard with sliding ray
 */
function hyperbolaQuintessenceAlgorithm(occupied, position, mask) {
    assert(typeof occupied === 'bigint', "Argument is not a BigInt");
    assert(typeof position === 'bigint', "Argument is not a BigInt");
    assert(typeof mask === 'bigint', "Argument is not a BigInt");

    let blockers = occupied & mask;
    let positiveRay = ((blockers - 2n * position) ^ occupied) & mask;
    let negativeRay = (reverseBitboard((reverseBitboard(blockers) - 2n * reverseBitboard(position))) ^ occupied) & mask;
    return {
        wholeRay: positiveRay | negativeRay,
        positiveRay: positiveRay,
        negativeRay: negativeRay
    };
}

/**
 * 
 * @param {bigint} bitboard 
 * @returns Bitboard reversed
 */
function reverseBitboard(bitboard) {
    assert(typeof bitboard === 'bigint', "Invalid bitboard");
    let bitboardString = bitboardToString(bitboard);

    //complete to 64 bits
    let numberOfBits = bitboardString.length;
    if (bitboardString.length < 64) {
        let bitsLeftToAdd = 64 - numberOfBits;
        bitboardString = "0".repeat(bitsLeftToAdd) + bitboardString;
    }

    //reverse bitboard
    let reversedBitboardString = bitboardString.split('').reverse().join('');
    let reversedBitboard = BigInt("0b" + reversedBitboardString);
    return reversedBitboard;
}

/**
 * 
 * @param {bigint} bitboard 
 * @returns Bitboard as a string
 */
function bitboardToString(bitboard) {
    assert(typeof bitboard === 'bigint', "Invalid bitboard");
    let bitboardString;

    if (0 <= bitboard) {
        bitboardString = bitboard.toString(2);
    } else {
        bitboardString = BigInt.asUintN(64, bitboard).toString(2);
    }

    return bitboardString;
}

/**
 * Returns two's complement of a binary string. Taken from:https : https://stackoverflow.com/questions/70710579/javascript-bigint-print-unsigned-binary-represenation
 * @param {string} binaryString 
 */
function twosComplement(binaryString) {
    let complement = BigInt('0b' + binaryString.split('').map(e => e === "0" ? "1" : "0").join(''));
    return complement + BigInt(1);
}

/**
 * Prints bitboard to console
 * @param {bigint} bitboard 
 */
function printBitboard(bitboard) {
    assert(typeof bitboard === 'bigint', "Invalid bitboard");

    let bitboardString = bitboardToString(bitboard);

    let newString = "";

    for (let i = 0; i < 64; i++) {
        if (i < bitboardString.length) {
            newString = bitboardString.charAt(bitboardString.length - 1 - i) + " " + newString;
        } else {
            newString = 0 + " " + newString;
        }

        if (((i + 1) % NUMBER_OF_FILES) === 0) {
            newString = "\n" + newString;
        }
    }
    console.log(newString);
}

/**
 * 
 * @param {boolean} bool 
 * @returns If true, a bitboard full of 1's. Otherwise, returns 0.
 */
function getBooleanBitboard(bool) {
    assert(typeof bool === 'boolean', "Invalid argument");
    if (bool) {
        return 0xFFFFFFFFFFFFFFFFn;
    } else {
        return 0x0000000000000000n;
    }
}

/**
 * Gives a bitboard with a single file.
 * @param {number} fileNumber Number of the file, going from 1 to 8, where 1 is the leftmost column of the board.
 * @returns {BigInt} Bitboard that contains the specified file.
 */
function getFile(fileNumber) {
    assertFile(fileNumber);
    let fileBitboard = FIRST_FILE_BITBOARD;
    //Move first file n positions
    fileBitboard = fileBitboard << BigInt(8 - fileNumber);
    return fileBitboard;
}

/**
 * Gives a bitboard with a single file.
 * @param {number} rankNumber Number of the rank, going from 1 to 8, where 1 is the bottom row of the board.
 * @returns {BigInt} Bitboard that contains the specified rank.
 */
function getRank(rankNumber) {

    assertRank(rankNumber);

    let rankBitboard = FIRST_RANK_BITBOARD;
    //Move first rank n positions
    rankBitboard = rankBitboard << BigInt((rankNumber - 1) * NUMBER_OF_RANKS);
    return rankBitboard;
}

/**
 * Gives a bitboard with a single diagonal that contains the square given by rank and file.
 * @param {number} rank
 * @param {number} file
 * @returns {BigInt} Bitboard that contains the diagonal.
 */
function getDiagonal(rank, file) {

    assertRank(rank);
    assertFile(file);

    let diagonalNumber = (9 - file) + rank - 1;
    // Calculate for up to the eight diagonal
    let clampedDiagonalNumber = diagonalNumber;
    if (8 < diagonalNumber) {
        clampedDiagonalNumber = 8 - (diagonalNumber % 8);
    }

    //Build the diagonal procedurally
    let diagonalBitboard = 1n;
    for (let i = 1; i < clampedDiagonalNumber; i++) {
        diagonalBitboard = (diagonalBitboard << 1n) | (1n << BigInt(8 * i))
    }

    // Flip diagonally for diagonals greater than the eight one.
    if (8 < diagonalNumber) {
        diagonalBitboard = this.flipDiagonally(diagonalBitboard);
    }

    return diagonalBitboard;
}

/**
 * Gives a bitboard with a single antidiagonal that contains the square given by rank and file.
 * @param {number} rank
 * @param {number} file
 * @returns {BigInt} Bitboard that contains the antidiagonal.
 */
function getAntiDiagonal(rank, file) {

    assertRank(rank);
    assertFile(file);

    // Get a normal diagonal
    let diagonalBitboard = this.getDiagonal(rank, 9 - file);
    // Mirror the diagonal horizontally to get an antiDiagonal.
    let antiDiagonalBitboard = mirrorHorizontally(diagonalBitboard);
    return antiDiagonalBitboard;
}

/**
 * Flips a bitboard along the 8th diagonal (middle diagonal).
 * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
 * @param {BigInt} bitboard
 * @returns {BigInt} Flipped bitboard
 */
function flipDiagonally(bitboard) {
    assert(typeof bitboard === "bigint", "Invalid bitboard");

    let k4 = 0xf0f0f0f00f0f0f0fn;
    let k2 = 0xcccc0000cccc0000n;
    let k1 = 0xaa00aa00aa00aa00n;
    let t;

    t = bitboard ^ (bitboard << 36n);
    bitboard ^= k4 & (t ^ (bitboard >> 36n));
    t = k2 & (bitboard ^ (bitboard << 18n));
    bitboard ^= t ^ (t >> 18n);
    t = k1 & (bitboard ^ (bitboard << 9n));
    bitboard ^= t ^ (t >> 9n);

    return bitboard;
}

/**
 * Mirrors a bitboard along a vertical line.
 * Taken from: https://www.chessprogramming.org/Flipping_Mirroring_and_Rotating
 * @param {BigInt} bitboard
 * @returns {BigInt} Mirrored bitboard
 */
function mirrorHorizontally(bitboard) {
    assert(typeof bitboard === "bigint", "Invalid bitboard");

    let k1 = 0x5555555555555555n;
    let k2 = 0x3333333333333333n;
    let k4 = 0x0f0f0f0f0f0f0f0fn;

    bitboard = ((bitboard >> 1n) & k1) | ((bitboard & k1) << 1n);
    bitboard = ((bitboard >> 2n) & k2) | ((bitboard & k2) << 2n);
    bitboard = ((bitboard >> 4n) & k4) | ((bitboard & k4) << 4n);

    return bitboard;
}
