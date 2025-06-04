import fs from 'fs';

const wasmData = fs.readFileSync('./src/executor/emulator-emscripten.wasm');
const out = `module.exports = { EmulatorEmscriptenWasm: '${wasmData.toString('base64')}' }`;

fs.writeFileSync('./src/executor/emulator-emscripten.wasm.js', out);
