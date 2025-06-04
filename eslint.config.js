// eslint-disable-next-line @typescript-eslint/no-require-imports
const base = require('@ton/toolchain');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tsEslint = require('@ton/toolchain').tsEslint;

module.exports = [
    { ignores: ['src/executor/emulator-emscripten*'] },
    ...base,
    {
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            'no-useless-catch': 'warn',
            'no-constant-binary-expression': 'warn',
            'import/order': 'warn',
            'no-empty': 'warn',
            'no-useless-escape': 'warn',
            'no-console': 'warn',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-this-alias': 'warn',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/no-require-imports': 'warn',
        },
    },
    {
        files: ['**/*.fixture.ts'],
        rules: {
            'no-undef': 'off',
        },
    },
    {
        files: ['**/*.spec.ts'],
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            '@typescript-eslint/no-unused-expressions': 'warn',
        },
    },
];
