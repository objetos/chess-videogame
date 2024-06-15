const libraryName = 'Chess'
import jscc from 'rollup-plugin-jscc'

export default [
    {
        input: 'src/Game.js',
        output: {
            file: 'devlog-builds/pawn-teleport-bug.js',
            format: 'iife',
            name: libraryName
        },
        plugins: [
            jscc({
                values: { _NO_SPECIAL_MOVES: true, _PAWN_TELEPORT: true, _NO_KING_SAFETY: true },
            })
        ]
    }, {
        input: 'src/Game.js',
        output: {
            file: 'devlog-builds/no-special-moves-no-king-safety.js',
            format: 'iife',
            name: libraryName
        },
        plugins: [
            jscc({
                values: { _NO_SPECIAL_MOVES: true, _PAWN_TELEPORT: false, _NO_KING_SAFETY: true },
            })
        ]
    }, {
        input: 'src/Game.js',
        output: {
            file: 'devlog-builds/no-king-safety.js',
            format: 'iife',
            name: libraryName
        },
        plugins: [
            jscc({
                values: { _NO_SPECIAL_MOVES: false, _PAWN_TELEPORT: false, _NO_KING_SAFETY: true },
            })
        ]
    }
];