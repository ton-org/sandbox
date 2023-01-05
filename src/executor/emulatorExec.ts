import { Address, Cell } from "ton";
import BN from "bn.js";
import { base64Decode } from "../utils/base64";
import { bocOrCellToStr } from "../utils/boc";

const EmulatorModule = require('./emulator-emscripten.js');

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
    c7: string | null
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
    c7: string | null
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
    debugLogs: string[]
};

const copyToCString = (mod: any, str: string) => {
    const len = mod.lengthBytesUTF8(str) + 1;
    const ptr = mod._malloc(len);
    mod.stringToUTF8(str, ptr, len);
    return ptr;
}

const copyFromCString = (mod: any, ptr: any): string => {
    return mod.UTF8ToString(ptr);
};

let mod: any = null;
let debugLogs: string[] = [];
const createMod = async () => {
    if (mod === null) {
        mod = await EmulatorModule({
            wasmBinary: base64Decode(require('./emulator-emscripten.wasm.js').EmulatorEmscriptenWasm),
            printErr: (text: string) => debugLogs.push(text),
        });
    }

    return mod;
};

let emulator: {
    emPtr: any
    config: string
    verbosity: number
} | null = null;

const forceCreateEmulator = (mod: any, config: string, verbosity: number): any => {
    const configPtr = copyToCString(mod, config);
    const emPtr = mod._create_emulator(configPtr, verbosity);
    mod._free(configPtr);
    emulator = {
        emPtr,
        config,
        verbosity,
    };
    return emPtr;
};
const createEmulator = (mod: any, config: string, verbosity: number): any => {
    if (emulator === null) {
        return forceCreateEmulator(mod, config, verbosity);
    }

    if (config === emulator.config && verbosity === emulator.verbosity) {
        return emulator.emPtr;
    }

    mod._destroy_emulator(emulator.emPtr);

    return forceCreateEmulator(mod, config, verbosity);
};

type StringPtr = { ptr: any, len: number } | null;

const ptrs: { [key: string]: StringPtr } = {
    libs: null,
    shardAccount: null,
    msg: null,
    params: null,
};

const populatePtr = (mod: any, str: string, ptrsObj: typeof ptrs, key: string) => {
    const len = mod.lengthBytesUTF8(str) + 1;
    if (ptrsObj[key] === null || ptrsObj[key]!.len < len) {
        if (ptrsObj[key] !== null) {
            mod._free(ptrsObj[key]!.ptr);
        }
        const allocLen = len * 2;
        const strPtr: StringPtr = { ptr: mod._malloc(allocLen), len: allocLen };
        ptrsObj[key] = strPtr;
    }

    mod.stringToUTF8(str, ptrsObj[key]!.ptr, len);
    return ptrsObj[key]!.ptr;
};

export const emulateTransaction = async (config: Cell | string, shardAccount: Cell | string, message: Cell | string, opts?: EmulationOptions): Promise<EmulationResult> => {
    const mod = await createMod();

    const verbosity = opts?.verbosity ?? 1;

    const emPtr = createEmulator(mod, bocOrCellToStr(config), verbosity);

    const libsPtr = opts?.libs === undefined ? 0 : populatePtr(mod, bocOrCellToStr(opts.libs), ptrs, 'libs');

    const shardAccountPtr = populatePtr(mod, bocOrCellToStr(shardAccount), ptrs, 'shardAccount');

    const msgPtr = populatePtr(mod, bocOrCellToStr(message), ptrs, 'msg');

    const params: EmulationInternalParams = {
        utime: opts?.params?.unixTime ?? 0,
        lt: opts?.params?.lt?.toString() ?? '0',
        rand_seed: opts?.params?.randSeed?.toString('hex') ?? '',
        ignore_chksig: opts?.params?.ignoreChksig ?? false,
    };

    const paramsPtr = populatePtr(mod, JSON.stringify(params), ptrs, 'params');

    debugLogs = [];
    const respPtr = mod._emulate(emPtr, libsPtr, shardAccountPtr, msgPtr, paramsPtr);
    const curDebugLogs = [...debugLogs];

    const respStr = copyFromCString(mod, respPtr);
    mod._free(respPtr);

    const resp = JSON.parse(respStr);

    if ('fail' in resp && resp.fail) {
        throw new Error('message' in resp ? resp.message : 'Unknown emulation error');
    }

    const logs: string = resp.logs;

    const result: ResultSuccess | ResultError = resp.output;

    return {
        result: result.success ? {
            success: true,
            transaction: result.transaction,
            shardAccount: result.shard_account,
            vmLog: result.vm_log,
            c7: result.c7,
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
        debugLogs: curDebugLogs,
    };
};

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
    stack: string
    gas_used: string
    vm_exit_code: number
    vm_log: string
    c7: string
    missing_library: string | null
};

export type GetMethodResultError = {
    success: false
    error: string
};

export type GetMethodResult = {
    logs: string
    debugLogs: string[]
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
    stack: Cell | string,
    config: Cell | string,
    opts?: GetMethodParams
): Promise<GetMethodResult> => {
    const mod = await createMod();

    const allocatedPtrs: any[] = [];

    const pushPtr = (ptr: any): any => {
        allocatedPtrs.push(ptr);
        return ptr;
    };

    const configPtr = pushPtr(copyToCString(mod, bocOrCellToStr(config)));

    const stackPtr = pushPtr(copyToCString(mod, bocOrCellToStr(stack)));

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

    debugLogs = [];
    const respPtr = pushPtr(mod._run_get_method(paramsPtr, stackPtr, configPtr));
    const curDebugLogs = [...debugLogs];

    const respStr = copyFromCString(mod, respPtr);

    const resp = JSON.parse(respStr);

    if ('fail' in resp && resp.fail) {
        throw new Error('message' in resp ? resp.message : 'Unknown emulation error');
    }

    allocatedPtrs.forEach(ptr => mod._free(ptr));

    return {
        logs: resp.logs,
        result: resp.output,
        debugLogs: curDebugLogs,
    };
};