const fs = require('fs')

const wasmData = fs.readFileSync('./src/emulator-exec/emulator-emscripten.wasm')
const out = `module.exports = { EmulatorEmscriptenWasm: '${wasmData.toString('base64')}' }`

fs.writeFileSync('./src/emulator-exec/emulator-emscripten.wasm.js', out)