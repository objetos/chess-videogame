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
