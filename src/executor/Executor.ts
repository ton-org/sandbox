import {Address, Cell, serializeTuple, TupleItem} from "ton-core";
import {base64Decode} from "../utils/base64";
const EmulatorModule = require('./emulator-emscripten.js');

export type GetMethodArgs = {
    code: Cell,
    data: Cell,
    methodId: number,
    stack: TupleItem[],
    config: string,
    verbosity: ExecutorVerbosity
    libs?: Cell
    address: Address
    unixTime: number
    balance: bigint
    randomSeed: Buffer
    gasLimit: bigint
    debugEnabled: boolean
}

export type GetMethodResultSuccess = {
    success: true
    stack: string
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
    output: GetMethodResultSuccess | GetMethodResultError
    logs: string
    debugLogs: string
};

export type RunTransactionArgs = {
    config: string
    libs: Cell | null
    verbosity: ExecutorVerbosity
    shardAccount: string
    message: Cell
    now: number
    lt: bigint
    randomSeed: Buffer | null
    ignoreChksig: boolean
    isTickTock?: boolean
    isTock?: boolean
    debugEnabled: boolean
}

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
    debug_enabled: boolean
};

type EmulationInternalParams = {
    utime: number
    lt: string
    rand_seed: string
    ignore_chksig: boolean
    is_tick_tock?: boolean
    is_tock?: boolean
    debug_enabled: boolean
};

export type ExecutorVerbosity = 'short' | 'full' | 'full_location' | 'full_location_stack'

type ResultSuccess = {
    success: true
    transaction: string
    shard_account: string
    vm_log: string
    actions: string | null
}

type ResultError = {
    success: false
    error: string
} & ({
    vm_log: string
    vm_exit_code: number
} | {})

export type EmulationResultSuccess = {
    success: true
    transaction: string
    shardAccount: string
    vmLog: string
    actions: string | null
}

export type VMResults = {
    vmLog: string
    vmExitCode: number
}

export type EmulationResultError = {
    success: false
    error: string
    vmResults?: VMResults
}

export type EmulationResult = {
    result: EmulationResultSuccess | EmulationResultError
    logs: string
    debugLogs: string
}

const verbosityToNum: Record<ExecutorVerbosity, number> = {
    'short': 0,
    'full': 1,
    'full_location': 2,
    'full_location_stack': 3,
}

class Pointer {
    length: number
    rawPointer: number
    inUse: boolean = true

    constructor(length: number, rawPointer: number) {
        this.length = length
        this.rawPointer = rawPointer
    }

    alloc() {
        this.inUse = true
    }

    free() {
        this.inUse = false
    }
}

class Heap {
    private pointers: Pointer[] = []
    private module: any
    private maxPtrs: number = 0

    constructor(module: any) {
        this.module = module
    }

    getPointersForStrings(strs: string[]): number[] {
        this.maxPtrs = Math.max(this.maxPtrs, strs.length)
        const sorted = strs.map((str, i) => ({ str, i })).sort((a, b) => b.str.length - a.str.length)
        const ptrs = sorted.map(e => ({ i: e.i, ptr: this.getCStringPointer(e.str) })).sort((a, b) => a.i - b.i).map(e => e.ptr.rawPointer)
        this.pointers.sort((a, b) => b.length - a.length)
        this.pointers.slice(this.maxPtrs).forEach(ptr => this.module._free(ptr.rawPointer))
        this.pointers = this.pointers.slice(0, this.maxPtrs)
        this.pointers.forEach(p => p.free())
        return ptrs
    }

    getCStringPointer(data: string) {
        let length = this.module.lengthBytesUTF8(data) + 1

        let existing = this.pointers.find(p => p.length >= length && !p.inUse)

        if (existing) {
            this.module.stringToUTF8(data, existing.rawPointer, length)
            existing.alloc()
            return existing
        }

        const len = this.module.lengthBytesUTF8(data) + 1;
        const ptr = this.module._malloc(len);
        this.module.stringToUTF8(data, ptr, len);
        let pointer = new Pointer(length, ptr)
        this.pointers.push(new Pointer(length, ptr))
        return pointer
    }
}

export class Executor {
    private module: any
    private heap: Heap
    private emulator?: {
        ptr: number
        config: string
        verbosity: number
    }
    private debugLogs: string[] = []

    private constructor(module: any) {
        this.module = module
        this.heap = new Heap(module)
    }

    static async create() {
        const ex = new Executor(await EmulatorModule({
            wasmBinary: base64Decode(require('./emulator-emscripten.wasm.js').EmulatorEmscriptenWasm),
            printErr: (text: string) => ex.debugLogs.push(text),
        }))
        return ex
    }

    runGetMethod(args: GetMethodArgs): GetMethodResult {
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

        let stack = serializeTuple(args.stack)

        this.debugLogs = []
        const resp = JSON.parse(this.extractString(this.invoke('_run_get_method', [
            JSON.stringify(params),
            stack.toBoc().toString('base64'),
            args.config,
        ])))
        const debugLogs = this.debugLogs.join('\n')

        if (resp.fail) {
            console.error(resp)
            throw new Error('Unknown emulation error');
        }

        return {
            output: resp.output,
            logs: resp.logs,
            debugLogs,
        };
    }

    runTransaction(args: RunTransactionArgs): EmulationResult {
        let params: EmulationInternalParams = {
            utime: args.now,
            lt: args.lt.toString(),
            rand_seed: args.randomSeed === null ? '' : args.randomSeed.toString('hex'),
            ignore_chksig: args.ignoreChksig,
            is_tick_tock: args.isTickTock ?? false,
            is_tock: args.isTickTock ? args.isTock : false,
            debug_enabled: args.debugEnabled,
        }

        this.debugLogs = []
        const resp = JSON.parse(this.extractString(this.invoke('_emulate', [
            // this.getEmulatorPointer(args.config, verbosityToNum[args.verbosity]),
            args.config,
            args.libs?.toBoc().toString('base64') ?? 0,
            verbosityToNum[args.verbosity],
            args.shardAccount,
            args.message.toBoc().toString('base64'),
            JSON.stringify(params)
        ])))
        const debugLogs = this.debugLogs.join('\n')

        if (resp.fail) {
            console.error(resp)
            throw new Error('Unknown emulation error');
        }

        const logs: string = resp.logs;

        const result: ResultSuccess | ResultError = resp.output;

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
            debugLogs,
        };
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
        const invocationArgs: number[] = []
        const strArgs: { str: string, i: number }[] = []
        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            if (typeof arg === 'string') {
                strArgs.push({ str: arg, i });
            } else {
                invocationArgs[i] = arg;
            }
        }
        const strPtrs = this.heap.getPointersForStrings(strArgs.map(e => e.str));
        for (let i = 0; i < strPtrs.length; i++) {
            invocationArgs[strArgs[i].i] = strPtrs[i];
        }

        return this.module[method](...invocationArgs);
    }

    private extractString(ptr: number): string {
        const str = this.module.UTF8ToString(ptr)
        this.module._free(ptr)
        return str
    }
}
