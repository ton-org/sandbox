const fs = require('fs')

const wasmData = fs.readFileSync('./src/emulator-exec/emulator-exec.wasm')
const out = `module.exports = { EmulatorExecWasm: '${wasmData.toString('base64')}' }`

fs.writeFileSync('./src/emulator-exec/emulator-exec.wasm.js', out)