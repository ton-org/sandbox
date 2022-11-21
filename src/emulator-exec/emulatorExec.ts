import { Cell } from "ton";
import BN from "bn.js";
import { base64Decode } from "../utils/base64";
import { bocOrCellToStr } from "../utils/boc";

const EmulatorModule = require('./emulator-exec.js');
const EmulatorExecWasmBinary = base64Decode(require('./emulator-exec.wasm.js').EmulatorExecWasm);

const copyToCString = (mod: any, str: string) => {
    const len = mod.lengthBytesUTF8(str) + 1;
    const ptr = mod._malloc(len);
    mod.stringToUTF8(str, ptr, len);
    return ptr;
}

const copyFromCString = (mod: any, ptr: any): string => {
    return mod.UTF8ToString(ptr);
};

export type EmulationParams = Partial<{
    unixTime: number
    lt: BN
    randSeed: Buffer
    ignoreChksig: boolean
}>;

export type EmulationOptions = Partial<{
    libs: Cell | string
    verbosity: number
    params: EmulationParams
}>;

type Params = {
    utime: number
    lt: string
    rand_seed: string
    ignore_chksig: boolean
};

type ResultSuccess = {
    success: true
    transaction: string
    shard_account: string
    vm_log: string
};

type ResultError = {
    success: false
    error: string
} & ({
    vm_log: string
    vm_exit_code: number
} | {});

export type EmulationResultSuccess = {
    success: true
    transaction: string
    shardAccount: string
    vmLog: string
};

export type VMResults = {
    vmLog: string
    vmExitCode: number
};

export type EmulationResultError = {
    success: false
    error: string
    vmResults?: VMResults
};

export type EmulationResult = {
    result: EmulationResultSuccess | EmulationResultError
    logs: string
};

export const emulateTransaction = async (config: Cell | string, shardAccount: Cell | string, message: Cell | string, opts?: EmulationOptions): Promise<EmulationResult> => {
    const mod = await EmulatorModule({
        wasmBinary: EmulatorExecWasmBinary,
    });

    const allocatedPtrs: any[] = [];

    const pushPtr = (ptr: any): any => {
        allocatedPtrs.push(ptr);
        return ptr;
    };

    const configPtr = pushPtr(copyToCString(mod, bocOrCellToStr(config)));

    const libsPtr = opts?.libs === undefined ? 0 : pushPtr(copyToCString(mod, bocOrCellToStr(opts.libs)));

    const verbosity = opts?.verbosity ?? 1;

    const shardAccountPtr = pushPtr(copyToCString(mod, bocOrCellToStr(shardAccount)));

    const msgPtr = pushPtr(copyToCString(mod, bocOrCellToStr(message)));

    const params: Params = {
        utime: opts?.params?.unixTime ?? 0,
        lt: opts?.params?.lt?.toString() ?? '0',
        rand_seed: opts?.params?.randSeed?.toString('base64') ?? '',
        ignore_chksig: opts?.params?.ignoreChksig ?? false,
    };

    const paramsPtr = pushPtr(copyToCString(mod, JSON.stringify(params)));

    const respPtr = pushPtr(mod._emulate(configPtr, libsPtr, verbosity, shardAccountPtr, msgPtr, paramsPtr));

    const respStr = copyFromCString(mod, respPtr);

    const resp = JSON.parse(respStr);

    if ('fail' in resp && resp.fail) {
        throw new Error('message' in resp ? resp.message : 'Unknown emulation error');
    }

    const logs: string = resp.logs;

    const result: ResultSuccess | ResultError = resp.output;

    allocatedPtrs.forEach(ptr => mod._free(ptr));

    return {
        result: result.success ? {
            success: true,
            transaction: result.transaction,
            shardAccount: result.shard_account,
            vmLog: result.vm_log,
        } : {
            success: false,
            error: result.error,
            vmResults: 'vm_log' in result ? {
                vmLog: result.vm_log,
                vmExitCode: result.vm_exit_code,
            } : undefined,
        },
        logs,
    };
};