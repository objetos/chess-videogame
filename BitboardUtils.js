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

    let rankDiff = startRank - endRank;
    let fileDiff = startFile - endFile;
    let isPositiveRay = false;
    let mask = 0n;

    if (startRank === endRank) {
        mask = Board.GetRank(startRank);
        isPositiveRay = startFile > endFile;
    } else if (startFile === endFile) {
        mask = Board.GetFile(startFile);
        isPositiveRay = startRank < endRank;
    } else if (Math.abs(rankDiff) === Math.abs(fileDiff)) {
        let isDiagonal = Math.sign(rankDiff) === Math.sign(fileDiff);
        if (isDiagonal) {
            mask = Board.GetDiagonal(startRank, startFile);
            isPositiveRay = rankDiff < 0 && fileDiff < 0;
        } else {
            mask = Board.GetAntiDiagonal(startRank, startFile);
            isPositiveRay = 0 < rankDiff && fileDiff > 0;
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
