import fs from 'fs';

function encode(src: string, dest: string, name: string) {
    const data = fs.readFileSync(src);
    const out = `module.exports = { ${name}: '${data.toString('base64')}'}\n`;
    fs.writeFileSync(dest, out);
}

encode(
    './src/executor/emulator-emscripten.wasm',
    './src/executor/emulator-emscripten.wasm.js',
    'EmulatorEmscriptenWasm',
);

encode(
    './src/executor/emulator-emscripten.debugger.bpatch.gzip',
    './src/executor/emulator-emscripten.debugger.bpatch.gzip.js',
    'DebuggerPatchGzip',
);
