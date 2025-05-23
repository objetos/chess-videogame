const libraryName = 'Chess'
import jscc from 'rollup-plugin-jscc'
import cleanup from 'rollup-plugin-cleanup';

export default [{
    input: 'src/Game.js',
    output: {
        file: 'build/Chess.js',
        format: 'iife',
        name: libraryName
    },
    plugins: [
        cleanup()
    ]
}
];