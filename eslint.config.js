const base = require('@ton/toolchain');
const globals = require('globals');

module.exports = [
    ...base,
    { ignores: ['src/executor/emulator-emscripten*'] },
    {
        files: ['src/jest/**/*.ts', 'src/jest/**/*.tsx'],
        languageOptions: {
            globals: {
                ...globals.jest,
                ...globals.node,
            },
        },
    },
];
