import { Address, beginCell, Cell, parseTuple, serializeTuple, TupleItem } from '@ton/core';
import { gunzipSync } from 'fflate';

import { base64Decode } from '../utils/base64';
import { ExtraCurrency } from '../utils/ec';
import { decodePatch } from '../utils/bpatch';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EmulatorModule = require('./emulator-emscripten.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DebuggerEmulatorModule = require('./emulator-emscripten.debugger.js');

export type BlockId = {
    workchain: number;
    shard: bigint;
    seqno: number;
    rootHash: Buffer;
    fileHash: Buffer;
};

function blockIdToTuple(blockId: BlockId): TupleItem[] {
    return [
        { type: 'int', value: BigInt(blockId.workchain) },
        { type: 'int', value: blockId.shard },
        { type: 'int', value: BigInt(blockId.seqno) },
        { type: 'int', value: BigInt('0x' + blockId.rootHash.toString('hex')) },
        { type: 'int', value: BigInt('0x' + blockId.fileHash.toString('hex')) },
    ];
}

export type PrevBlocksInfo = {
    lastMcBlocks: BlockId[];
    prevKeyBlock: BlockId;
    lastMcBlocks100?: BlockId[];
};

function prevBlocksInfoToTuple(prevBlocksInfo: PrevBlocksInfo): TupleItem[] {
    const r: TupleItem[] = [
        {
            type: 'tuple',
            items: prevBlocksInfo.lastMcBlocks.map((bid) => ({ type: 'tuple', items: blockIdToTuple(bid) })),
        },
        { type: 'tuple', items: blockIdToTuple(prevBlocksInfo.prevKeyBlock) },
    ];

    if (prevBlocksInfo.lastMcBlocks100) {
        r.push({
            type: 'tuple',
            items: prevBlocksInfo.lastMcBlocks100.map((bid) => ({ type: 'tuple', items: blockIdToTuple(bid) })),
        });
    }

    return r;
}

function serializeTupleAsStackEntry(tuple: TupleItem[]): Cell {
    const c = serializeTuple([{ type: 'tuple', items: tuple }]);
    const s = c.beginParse();
    s.skip(24);
    s.loadRef();
    return s.asCell();
}

export type GetMethodArgs = {
    code: Cell;
    data: Cell;
    methodId: number;
    stack: TupleItem[];
    config: string;
    verbosity: ExecutorVerbosity;
    libs?: Cell;
    address: Address;
    unixTime: number;
    balance: bigint;
    randomSeed: Buffer;
    gasLimit: bigint;
    debugEnabled: boolean;
    extraCurrency?: ExtraCurrency;
    prevBlocksInfo?: PrevBlocksInfo;
};

export type GetMethodResultSuccess = {
    success: true;
    stack: string;
    gas_used: string;
    vm_exit_code: number;
    vm_log: string;
    missing_library: string | null;
};

export type GetMethodResultError = {
    success: false;
    error: string;
};

export type GetMethodResult = {
    output: GetMethodResultSuccess | GetMethodResultError;
    logs: string;
    debugLogs: string;
};

export type RunCommonArgs = {
    config: string;
    libs: Cell | null;
    verbosity: ExecutorVerbosity;
    shardAccount: string;
    now: number;
    lt: bigint;
    randomSeed: Buffer | null;
    ignoreChksig: boolean;
    debugEnabled: boolean;
    prevBlocksInfo?: PrevBlocksInfo;
};

export type RunTransactionArgs = {
    message: Cell;
} & RunCommonArgs;

export type TickOrTock = 'tick' | 'tock';

export type RunTickTockArgs = {
    which: TickOrTock;
} & RunCommonArgs;

type GetMethodInternalParams = {
    code: string;
    data: string;
    verbosity: number;
    libs: string;
    address: string;
    unixtime: number;
    balance: string;
    rand_seed: string;
    gas_limit: string;
    method_id: number;
    debug_enabled: boolean;
    extra_currencies?: { [k: string]: string };
    prev_blocks_info?: string;
};

type EmulationInternalParams = {
    utime: number;
    lt: string;
    rand_seed: string;
    ignore_chksig: boolean;
    debug_enabled: boolean;
    is_tick_tock?: boolean;
    is_tock?: boolean;
    prev_blocks_info?: string;
};

export type ExecutorVerbosity =
    | 'short'
    | 'full'
    | 'full_location'
    | 'full_location_gas'
    | 'full_location_stack'
    | 'full_location_stack_verbose';

type ResultSuccess = {
    success: true;
    transaction: string;
    shard_account: string;
    vm_log: string;
    actions: string | null;
};

type ResultError = {
    success: false;
    error: string;
} & (
    | {
          vm_log: string;
          vm_exit_code: number;
      }
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    | {}
);

export type EmulationResultSuccess = {
    success: true;
    transaction: string;
    shardAccount: string;
    vmLog: string;
    actions: string | null;
};

export type VMResults = {
    vmLog: string;
    vmExitCode: number;
};

export type EmulationResultError = {
    success: false;
    error: string;
    vmResults?: VMResults;
};

export type EmulationResult = {
    result: EmulationResultSuccess | EmulationResultError;
    logs: string;
    debugLogs: string;
};

const verbosityToNum: Record<ExecutorVerbosity, number> = {
    short: 0,
    full: 1,
    full_location: 2,
    full_location_gas: 3,
    full_location_stack: 4,
    full_location_stack_verbose: 5,
};

function runCommonArgsToInternalParams(args: RunCommonArgs): EmulationInternalParams {
    const p: EmulationInternalParams = {
        utime: args.now,
        lt: args.lt.toString(),
        rand_seed: args.randomSeed === null ? '' : args.randomSeed.toString('hex'),
        ignore_chksig: args.ignoreChksig,
        debug_enabled: args.debugEnabled,
    };

    if (args.prevBlocksInfo !== undefined) {
        p.prev_blocks_info = serializeTupleAsStackEntry(prevBlocksInfoToTuple(args.prevBlocksInfo))
            .toBoc()
            .toString('base64');
    }

    return p;
}

function getMethodArgsToInternalParams(args: GetMethodArgs): GetMethodInternalParams {
    const params: GetMethodInternalParams = {
        code: args.code.toBoc().toString('base64'),
        data: args.data.toBoc().toString('base64'),
        verbosity: verbosityToNum[args.verbosity],
        libs: args.libs?.toBoc().toString('base64') ?? '',
        address: args.address.toString(),
        unixtime: args.unixTime,
        balance: args.balance.toString(),
        rand_seed: args.randomSeed.toString('hex'),
        gas_limit: args.gasLimit.toString(),
        method_id: args.methodId,
        debug_enabled: args.debugEnabled,
    };

    if (args.extraCurrency !== undefined) {
        params.extra_currencies = {};
        for (const [k, v] of Object.entries(args.extraCurrency)) {
            params.extra_currencies[k] = v.toString();
        }
    }

    if (args.prevBlocksInfo !== undefined) {
        params.prev_blocks_info = serializeTupleAsStackEntry(prevBlocksInfoToTuple(args.prevBlocksInfo))
            .toBoc()
            .toString('base64');
    }

    return params;
}

class Pointer {
    length: number;
    rawPointer: number;
    inUse: boolean = true;

    constructor(length: number, rawPointer: number) {
        this.length = length;
        this.rawPointer = rawPointer;
    }

    alloc() {
        this.inUse = true;
    }

    free() {
        this.inUse = false;
    }
}

class Heap {
    private pointers: Pointer[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private module: any;
    private maxPtrs: number = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(module: any) {
        this.module = module;
    }

    getPointersForStrings(strs: string[]): number[] {
        this.maxPtrs = Math.max(this.maxPtrs, strs.length);
        const sorted = strs.map((str, i) => ({ str, i })).sort((a, b) => b.str.length - a.str.length);
        const ptrs = sorted
            .map((e) => ({ i: e.i, ptr: this.getCStringPointer(e.str) }))
            .sort((a, b) => a.i - b.i)
            .map((e) => e.ptr.rawPointer);
        this.pointers.sort((a, b) => b.length - a.length);
        this.pointers.slice(this.maxPtrs).forEach((ptr) => this.module._free(ptr.rawPointer));
        this.pointers = this.pointers.slice(0, this.maxPtrs);
        this.pointers.forEach((p) => p.free());
        return ptrs;
    }

    getCStringPointer(data: string) {
        let length = this.module.lengthBytesUTF8(data) + 1;

        let existing = this.pointers.find((p) => p.length >= length && !p.inUse);

        if (existing) {
            this.module.stringToUTF8(data, existing.rawPointer, length);
            existing.alloc();
            return existing;
        }

        const len = this.module.lengthBytesUTF8(data) + 1;
        const ptr = this.module._malloc(len);
        this.module.stringToUTF8(data, ptr, len);
        let pointer = new Pointer(length, ptr);
        this.pointers.push(new Pointer(length, ptr));
        return pointer;
    }
}

export interface IExecutor {
    runGetMethod(args: GetMethodArgs): Promise<GetMethodResult>;
    runTickTock(args: RunTickTockArgs): Promise<EmulationResult>;
    runTransaction(args: RunTransactionArgs): Promise<EmulationResult>;
}

let wasmBinary: Uint8Array | undefined = undefined;
function getWasmBinary() {
    if (wasmBinary !== undefined) {
        return wasmBinary;
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    wasmBinary = new Uint8Array(base64Decode(require('./emulator-emscripten.wasm.js').EmulatorEmscriptenWasm));
    return wasmBinary;
}

let debuggerWasmBinary: Uint8Array | undefined = undefined;
function getDebuggerWasmBinary() {
    if (debuggerWasmBinary !== undefined) {
        return debuggerWasmBinary;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const patch = base64Decode(require('./emulator-emscripten.debugger.bpatch.gzip.js').DebuggerPatchGzip);
    const unzipped = gunzipSync(patch);
    debuggerWasmBinary = decodePatch(getWasmBinary(), unzipped);

    return debuggerWasmBinary;
}

export class Executor implements IExecutor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private module: any;
    private heap: Heap;
    private emulator?: {
        ptr: number;
        config: string;
        verbosity: number;
    };
    private debugLogs: string[] = [];
    debugLogFunc: (s: string) => void = () => {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private constructor(module: any) {
        this.module = module;
        this.heap = new Heap(module);
    }

    private handleDebugLog(text: string) {
        this.debugLogs.push(text);
        this.debugLogFunc(text);
    }

    static async create(opts?: { debug?: boolean }) {
        const binary = opts?.debug ? getDebuggerWasmBinary() : getWasmBinary();
        const module = opts?.debug ? DebuggerEmulatorModule : EmulatorModule;

        let ex: Executor | undefined = undefined;
        const printErr = (text: string) => {
            if (ex === undefined) {
                // eslint-disable-next-line no-console
                console.error('Debug log received before executor was created:', text);
            } else {
                ex.handleDebugLog(text);
            }
        };

        ex = new Executor(
            await module({
                wasmBinary: binary,
                printErr,
            }),
        );
        return ex;
    }

    async runGetMethod(args: GetMethodArgs): Promise<GetMethodResult> {
        const params = getMethodArgsToInternalParams(args);

        let stack = serializeTuple(args.stack);

        this.debugLogs = [];
        const resp = JSON.parse(
            this.extractString(
                this.invoke('_run_get_method', [JSON.stringify(params), stack.toBoc().toString('base64'), args.config]),
            ),
        );
        const debugLogs = this.debugLogs.join('\n');

        if (resp.fail) {
            // eslint-disable-next-line no-console
            console.error(resp);
            throw new Error('Unknown emulation error');
        }

        return {
            output: resp.output,
            logs: resp.logs,
            debugLogs,
        };
    }

    private runCommon(args: (string | number)[]): EmulationResult {
        this.debugLogs = [];
        const resp = JSON.parse(this.extractString(this.invoke('_emulate_with_emulator', args)));
        const debugLogs = this.debugLogs.join('\n');

        if (resp.fail) {
            // eslint-disable-next-line no-console
            console.error(resp);
            throw new Error('Unknown emulation error');
        }

        const logs: string = resp.logs;

        const result: ResultSuccess | ResultError = resp.output;

        return {
            result: result.success
                ? {
                      success: true,
                      transaction: result.transaction,
                      shardAccount: result.shard_account,
                      vmLog: result.vm_log,
                      actions: result.actions,
                  }
                : {
                      success: false,
                      error: result.error,
                      vmResults:
                          'vm_log' in result
                              ? {
                                    vmLog: result.vm_log,
                                    vmExitCode: result.vm_exit_code,
                                }
                              : undefined,
                  },
            logs,
            debugLogs,
        };
    }

    async runTickTock(args: RunTickTockArgs): Promise<EmulationResult> {
        const params: EmulationInternalParams = {
            ...runCommonArgsToInternalParams(args),
            is_tick_tock: true,
            is_tock: args.which === 'tock',
        };

        return this.runCommon([
            this.getEmulatorPointer(args.config, verbosityToNum[args.verbosity]),
            args.libs?.toBoc().toString('base64') ?? 0,
            args.shardAccount,
            '',
            JSON.stringify(params),
        ]);
    }

    async runTransaction(args: RunTransactionArgs): Promise<EmulationResult> {
        const params: EmulationInternalParams = runCommonArgsToInternalParams(args);

        return this.runCommon([
            this.getEmulatorPointer(args.config, verbosityToNum[args.verbosity]),
            args.libs?.toBoc().toString('base64') ?? 0,
            args.shardAccount,
            args.message.toBoc().toString('base64'),
            JSON.stringify(params),
        ]);
    }

    private createEmulator(config: string, verbosity: number) {
        if (this.emulator !== undefined) {
            this.invoke('_destroy_emulator', [this.emulator.ptr]);
        }
        const ptr = this.invoke('_create_emulator', [config, verbosity]);
        this.emulator = {
            ptr,
            config,
            verbosity,
        };
    }

    private getEmulatorPointer(config: string, verbosity: number) {
        if (this.emulator === undefined || verbosity !== this.emulator.verbosity || config !== this.emulator.config) {
            this.createEmulator(config, verbosity);
        }

        return this.emulator!.ptr;
    }

    invoke(method: string, args: (number | string)[]): number {
        const invocationArgs: number[] = [];
        const strArgs: { str: string; i: number }[] = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (typeof arg === 'string') {
                strArgs.push({ str: arg, i });
            } else {
                invocationArgs[i] = arg;
            }
        }
        const strPtrs = this.heap.getPointersForStrings(strArgs.map((e) => e.str));
        for (let i = 0; i < strPtrs.length; i++) {
            invocationArgs[strArgs[i].i] = strPtrs[i];
        }

        return this.module[method](...invocationArgs);
    }

    sbsGetMethodSetup(args: GetMethodArgs) {
        const params = getMethodArgsToInternalParams(args);

        let stack = serializeTuple(args.stack);

        this.debugLogs = [];
        const res = this.invoke('_setup_sbs_get_method', [
            JSON.stringify(params),
            stack.toBoc().toString('base64'),
            args.config,
        ]);

        return res;
    }

    destroyTvmEmulator(ptr: number) {
        this.invoke('_destroy_tvm_emulator', [ptr]);
    }

    sbsGetMethodStep(ptr: number) {
        const res = this.invoke('_sbs_step', [ptr]);

        return res !== 0;
    }

    sbsGetMethodStack(ptr: number) {
        const resp = this.extractString(this.invoke('_sbs_get_stack', [ptr]));

        return parseTuple(Cell.fromBase64(resp));
    }

    sbsGetMethodC7(ptr: number) {
        const resp = this.extractString(this.invoke('_sbs_get_c7', [ptr]));

        return parseTuple(
            beginCell().storeUint(1, 24).storeRef(Cell.EMPTY).storeSlice(Cell.fromBase64(resp).beginParse()).endCell(),
        )[0];
    }

    sbsGetMethodGetContDistinguisher(ptr: number) {
        return this.invoke('_sbs_get_cont_distinguisher', [ptr]);
    }

    sbsGetMethodSetContDistinguishers(
        ptr: number,
        distinguisher: number,
        trueDistinguisher: number,
        falseDistinguisher: number,
    ) {
        this.invoke('_sbs_set_cont_distinguishers', [ptr, distinguisher, trueDistinguisher, falseDistinguisher]);
    }

    sbsGetMethodGetContDistinguisherTriggered(ptr: number) {
        return this.invoke('_sbs_get_cont_distinguisher_triggered', [ptr]) !== 0;
    }

    sbsGetMethodSetTryParams(ptr: number, primed: number, triggered: number) {
        this.invoke('_sbs_set_try_params', [ptr, primed, triggered]);
    }

    sbsGetMethodGetTriggeredTryParam(ptr: number) {
        return this.invoke('_sbs_get_triggered_try_param', [ptr]);
    }

    sbsGetMethodCodePos(ptr: number) {
        const resp = this.extractString(this.invoke('_sbs_get_code_pos', [ptr]));

        const parts = resp.split(':');

        return {
            hash: parts[0],
            offset: parseInt(parts[1]),
        };
    }

    sbsGetMethodResult(ptr: number): GetMethodResult {
        const resp = JSON.parse(this.extractString(this.invoke('_sbs_get_method_result', [ptr])));

        const debugLogs = this.debugLogs.join('\n');

        return {
            output: resp,
            logs: 'BLOCKCHAIN LOGS ARE NOT AVAILABLE IN DEBUGGER BETA',
            debugLogs,
        };
    }

    sbsTransactionSetup(args: RunTransactionArgs) {
        const emptr = this.invoke('_create_emulator', [args.config, verbosityToNum[args.verbosity]]);

        const params: EmulationInternalParams = runCommonArgsToInternalParams(args);

        this.debugLogs = [];
        const res = this.invoke('_emulate_sbs', [
            emptr,
            args.libs?.toBoc().toString('base64') ?? 0,
            args.shardAccount,
            args.message.toBoc().toString('base64'),
            JSON.stringify(params),
        ]);

        return { res, emptr };
    }

    destroyEmulator(ptr: number) {
        this.invoke('_destroy_emulator', [ptr]);
    }

    sbsTransactionStep(ptr: number) {
        const res = this.invoke('_em_sbs_step', [ptr]);

        return res !== 0;
    }

    sbsTransactionCodePos(ptr: number) {
        const resp = this.extractString(this.invoke('_em_sbs_code_pos', [ptr]));

        const parts = resp.split(':');

        return {
            hash: parts[0],
            offset: parseInt(parts[1]),
        };
    }

    sbsTransactionStack(ptr: number) {
        const resp = this.extractString(this.invoke('_em_sbs_stack', [ptr]));

        return parseTuple(Cell.fromBase64(resp));
    }

    sbsTransactionC7(ptr: number) {
        const resp = this.extractString(this.invoke('_em_sbs_c7', [ptr]));

        return parseTuple(
            beginCell().storeUint(1, 24).storeRef(Cell.EMPTY).storeSlice(Cell.fromBase64(resp).beginParse()).endCell(),
        )[0];
    }

    sbsTransactionGetContDistinguisher(ptr: number) {
        return this.invoke('_em_sbs_get_cont_distinguisher', [ptr]);
    }

    sbsTransactionSetContDistinguishers(
        ptr: number,
        distinguisher: number,
        trueDistinguisher: number,
        falseDistinguisher: number,
    ) {
        this.invoke('_em_sbs_set_cont_distinguishers', [ptr, distinguisher, trueDistinguisher, falseDistinguisher]);
    }

    sbsTransactionGetContDistinguisherTriggered(ptr: number) {
        return this.invoke('_em_sbs_get_cont_distinguisher_triggered', [ptr]) !== 0;
    }

    sbsTransactionSetTryParams(ptr: number, primed: number, triggered: number) {
        this.invoke('_em_sbs_set_try_params', [ptr, primed, triggered]);
    }

    sbsTransactionGetTriggeredTryParam(ptr: number) {
        return this.invoke('_em_sbs_get_triggered_try_param', [ptr]);
    }

    sbsTransactionResult(ptr: number): EmulationResult {
        const result = JSON.parse(this.extractString(this.invoke('_em_sbs_result', [ptr])));

        const debugLogs = this.debugLogs.join('\n');

        return {
            result: result.success
                ? {
                      success: true,
                      transaction: result.transaction,
                      shardAccount: result.shard_account,
                      vmLog: result.vm_log,
                      actions: result.actions,
                  }
                : {
                      success: false,
                      error: result.error,
                      vmResults:
                          'vm_log' in result
                              ? {
                                    vmLog: result.vm_log,
                                    vmExitCode: result.vm_exit_code,
                                }
                              : undefined,
                  },
            logs: 'BLOCKCHAIN LOGS ARE NOT AVAILABLE IN DEBUGGER BETA',
            debugLogs,
        };
    }

    private extractString(ptr: number): string {
        const str = this.module.UTF8ToString(ptr);
        this.module._free(ptr);
        return str;
    }

    getVersion(): { commitHash: string; commitDate: string } {
        const v: {
            emulatorLibCommitHash: string;
            emulatorLibCommitDate: string;
        } = JSON.parse(this.extractString(this.invoke('_version', [])));

        return {
            commitHash: v.emulatorLibCommitHash,
            commitDate: v.emulatorLibCommitDate,
        };
    }
}
