function assert(condition, message) {
    if (!condition) {
        let error = new Error();
        let stack = error.stack;
        let firstLineSkipIndex = stack.indexOf("\n");
        let secondLineSkipIndex = stack.indexOf("\n", firstLineSkipIndex + 2);
        let thisFunctionCall = stack.substring(firstLineSkipIndex, secondLineSkipIndex);
        stack = stack.replace(thisFunctionCall, "");
        console.log(stack);
        throw message || "Assertion failed";
    }
}

function assertRank(rank) {
    assert(rank !== undefined, "No rank provided");
    assert(typeof rank === "number", "Rank Invalid");
    assert(Number.isInteger(rank), "Rank is not an integer");
    assert(rank >= 1 && rank <= 8, "Rank " + rank + " is out of bounds.");

}

function assertFile(file) {
    assert(file !== undefined, "No file provided");
    assert(typeof file === "number", "File Invalid");
    assert(Number.isInteger(file), "File is not an integer");
    assert(file >= 1 && file <= 8, "File " + file + " is out of bounds.");
}
