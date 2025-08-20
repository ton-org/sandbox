const base = require('@ton/toolchain');

module.exports = [...base, { ignores: ['src/executor/emulator-emscripten*', '!src/coverage/**'] }];
