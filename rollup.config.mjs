const libraryName = 'Chess'
import jscc from 'rollup-plugin-jscc'

export default [{
    input: 'src/Game.js',
    output: {
        file: 'build/Chess.js',
        format: 'iife',
        name: libraryName
    }
}
];