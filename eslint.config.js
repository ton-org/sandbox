const base = require('@ton/toolchain');
const tsEslint = require('@ton/toolchain').tsEslint;

module.exports = [
    ...base,
    { ignores: ['src/executor/emulator-emscripten*'] },
    {
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
];
