import { Address, Cell } from "ton";
import BN from "bn.js";
import { base64Decode } from "../utils/base64";
import { bocOrCellToStr } from "../utils/boc";

const EmulatorModule = require('./emulator-emscripten.js');
const EmulatorEmscriptenWasmBinary = base64Decode(require('./emulator-emscripten.wasm.js').EmulatorEmscriptenWasm);

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

type EmulationInternalParams = {
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
    actions: string | null
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
    actions: string | null
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
        wasmBinary: EmulatorEmscriptenWasmBinary,
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

    const params: EmulationInternalParams = {
        utime: opts?.params?.unixTime ?? 0,
        lt: opts?.params?.lt?.toString() ?? '0',
        rand_seed: opts?.params?.randSeed?.toString('hex') ?? '',
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
            actions: result.actions,
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

export type TVMStackEntryCell = { type: 'cell', value: string };
export type TVMStackEntryCellSlice = { type: 'cell_slice', value: string };
export type TVMStackEntryNumber = { type: 'number', value: string };
export type TVMStackEntryTuple = { type: 'tuple', value: TVMStackEntry[] };
export type TVMStackEntryNull = { type: 'null' };

export type TVMStackEntry =
    | TVMStackEntryCell
    | TVMStackEntryCellSlice
    | TVMStackEntryNumber
    | TVMStackEntryTuple
    | TVMStackEntryNull;

export type GetMethodParams = Partial<{
    verbosity: number
    libs: Cell | string
    address: Address
    unixTime: number
    balance: BN
    randSeed: Buffer
    gasLimit: BN | number
}>;

export type GetMethodResultSuccess = {
    success: true
    stack: TVMStackEntry[]
    gas_used: string
    vm_exit_code: number
    vm_log: string
    missing_library: string | null
};

export type GetMethodResultError = {
    success: false
    error: string
};

export type GetMethodResult = {
    logs: string
    result: GetMethodResultSuccess | GetMethodResultError
};

type GetMethodInternalParams = {
    code: string
    data: string
    verbosity: number
    libs: string
    address: string
    unixtime: number
    balance: string
    rand_seed: string
    gas_limit: string
    method_id: number
};

export const runGetMethod = async (
    code: Cell | string,
    data: Cell | string,
    method: number,
    stack: TVMStackEntry[],
    config: Cell | string,
    opts?: GetMethodParams
): Promise<GetMethodResult> => {
    const mod = await EmulatorModule({
        wasmBinary: EmulatorEmscriptenWasmBinary,
    });

    const allocatedPtrs: any[] = [];

    const pushPtr = (ptr: any): any => {
        allocatedPtrs.push(ptr);
        return ptr;
    };

    const configPtr = pushPtr(copyToCString(mod, bocOrCellToStr(config)));

    const stackPtr = pushPtr(copyToCString(mod, JSON.stringify(stack)));

    const params: GetMethodInternalParams = {
        code: bocOrCellToStr(code),
        data: bocOrCellToStr(data),
        verbosity: opts?.verbosity ?? 1,
        libs: opts?.libs === undefined ? '' : bocOrCellToStr(opts.libs),
        address: (opts?.address ?? new Address(0, Buffer.alloc(32))).toString(),
        unixtime: opts?.unixTime ?? Math.floor(Date.now() / 1000),
        balance: opts?.balance === undefined ? '0' : opts.balance.toString(),
        rand_seed: (opts?.randSeed ?? Buffer.alloc(32)).toString('hex'),
        gas_limit: (opts?.gasLimit ?? 0).toString(),
        method_id: method,
    };

    const paramsPtr = pushPtr(copyToCString(mod, JSON.stringify(params)));

    const respPtr = pushPtr(mod._run_get_method(paramsPtr, stackPtr, configPtr));

    const respStr = copyFromCString(mod, respPtr);

    const resp = JSON.parse(respStr);

    if ('fail' in resp && resp.fail) {
        throw new Error('message' in resp ? resp.message : 'Unknown emulation error');
    }

    allocatedPtrs.forEach(ptr => mod._free(ptr));

    return {
        logs: resp.logs,
        result: resp.output,
    };
};