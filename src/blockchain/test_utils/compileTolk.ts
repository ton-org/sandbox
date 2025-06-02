import { Cell } from "@ton/core";
import { runTolkCompiler } from "@ton/tolk-js";

export async function compileTolk(source: string) {
    const r = await runTolkCompiler({
        entrypointFileName: 'main.tolk',
        fsReadCallback: (path) => {
            if (path === 'main.tolk') {
                return source
            }

            throw new Error(`File ${path} not found`)
        },
    });

    if (r.status === 'error') {
        throw new Error(r.message);
    }

    return Cell.fromBase64(r.codeBoc64);
}
