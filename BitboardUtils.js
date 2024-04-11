const FIRST_FILE = 0x0101010101010101n;
const FIRST_RANK = 0xFFn;

function RankFileToBitboard(rank, file) { //****** assertions, document
    //move to rank
    let bitboard = 1n << BigInt(8 - file);
    //move to file
    bitboard = bitboard << BigInt((rank - 1) * 8);
    return bitboard;
}

function GetRay(startRank, startFile, endRank, endFile, includeStart = true, includeEnd = true) {
    let start = RankFileToBitboard(startRank, startFile);
    let end = RankFileToBitboard(endRank, endFile);

    if (startRank === endRank && startFile === endFile) {
        if (includeStart || includeEnd) return start;
        else return 0n;
    }

    let rankDiff = endRank - startRank;
    let fileDiff = endFile - startFile;
    let isPositiveRay = false;
    let mask = 0n;

    if (startRank === endRank) {
        mask = getRank(startRank);
        isPositiveRay = endFile < startFile;
    } else if (startFile === endFile) {
        mask = getFile(startFile);
        isPositiveRay = startRank < endRank;
    } else if (Math.abs(rankDiff) === Math.abs(fileDiff)) {
        let isDiagonal = Math.sign(rankDiff) === Math.sign(fileDiff);
        if (isDiagonal) {
            mask = getDiagonal(startRank, startFile);
            isPositiveRay = 0 < rankDiff && 0 < fileDiff;
        } else {
            mask = getAntiDiagonal(startRank, startFile);
            isPositiveRay = 0 < rankDiff && fileDiff < 0;
        }
    } else {
        return 0n;
    }

    let rays = HyperbolaQuintessenceAlgorithm(end, start, mask);
    let ray = isPositiveRay ? rays[0] : rays[1];

    if (includeStart) ray = ray | start;
    if (!includeEnd) ray = ray & ~end;

    return ray;
}

function GetNumberOfBits(bitboard) {
    let numberOfBits = 0;
    while (bitboard > 0n) {
        bitboard = (bitboard - 1) & bitboard;
        numberOfBits++;
    }
    return numberOfBits;
}

//****** change return value from array
//Moves calculated using o^(o-2r) trick. 
//Taken from https://www.youtube.com/watch?v=bCH4YK6oq8M&list=PLQV5mozTHmacMeRzJCW_8K3qw2miYqd0c&index=9&ab_channel=LogicCrazyChess.
function HyperbolaQuintessenceAlgorithm(occupied, position, mask) {
    let blockers = occupied & mask;
    let positiveRay = ((blockers - 2n * position) ^ occupied) & mask;
    let negativeRay = (Reverse((Reverse(blockers) - 2n * Reverse(position))) ^ occupied) & mask;
    return [positiveRay, negativeRay];
}

function Reverse(bitboard) {
    let bitboardString = BitboardToString(bitboard);

    let numberOfBits = bitboardString.length;
    if (bitboardString.length < 64) {
        let bitsLeft = 64 - numberOfBits;
        bitboardString = "0".repeat(bitsLeft) + bitboardString;
    }
    let reversedBitboardString = bitboardString.split('').reverse().join('');
    let reversedBitboard = BigInt("0b" + reversedBitboardString);
    return reversedBitboard;
}

function BitboardToString(bitboard) {
    let bitboardString;

    if (0 <= bitboard) {
        bitboardString = bitboard.toString(2);
    } else {
        bitboardString = BigInt.asUintN(64, bitboard).toString(2);
    }

    return bitboardString;
}

// (REF) https://stackoverflow.com/questions/70710579/javascript-bigint-print-unsigned-binary-represenation#:~:text=Since%20negative%20BigInts%20are%20represented,based%20on%20the%20current%20length. 
// take two's complement of a binary string
function TwosComplement(binaryString) {
    let complement = BigInt('0b' + binaryString.split('').map(e => e === "0" ? "1" : "0").join(''));
    return complement + BigInt(1);
}

function PrintBitboard(bitboard) {
    let bitboardString = BitboardToString(bitboard);

    let newString = "";

    for (let i = 0; i < 64; i++) {
        if (i < bitboardString.length) {
            newString = bitboardString.charAt(bitboardString.length - 1 - i) + " " + newString;
        } else {
            newString = 0 + " " + newString;
        }

        if (((i + 1) % 8) === 0) {
            newString = "\n" + newString;
        }
    }
    console.log(newString);
}

function GetBooleanBitboard(bool) {
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

    let fileBitboard = FIRST_FILE;
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

    let rankBitboard = FIRST_RANK;
    //Move first rank n positions
    rankBitboard = rankBitboard << BigInt((rankNumber - 1) * 8);
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
