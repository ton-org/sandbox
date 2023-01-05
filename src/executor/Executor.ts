import {Address, Cell, serializeTuple, TupleItem} from "ton-core";
import {base64Decode} from "../utils/base64";
const EmulatorModule = require('./emulator-emscripten.js');

export type GetMethodArgs = {
    code: Cell,
    data: Cell,
    methodId: number,
    stack: TupleItem[],
    config: Cell,
    verbosity: Verbosity
    libs?: Cell
    address: Address
    unixTime: number
    balance: bigint
    randomSeed: Buffer
    gasLimit: bigint
}

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
    output: GetMethodResultSuccess | GetMethodResultError
};

export type RunTransactionArgs = {
    config: Cell
    libs: Cell | null
    verbosity: Verbosity
    shardAccount: Cell
    message: Cell
    now: number
    lt: bigint
    randomSeed: Buffer
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
};

type EmulationInternalParams = {
    utime: number
    lt: string
    rand_seed: string
    ignore_chksig: boolean
};

export type Verbosity = 'short' | 'full' | 'full_location' | 'full_location_stack';

const verbosityToNum: Record<Verbosity, number> = {
    'short': 0,
    'full': 1,
    'full_location': 2,
    'full_location_stack': 3,
};

class Pointer {
    length: number
    rawPointer: number
    inUse: boolean = true

    constructor(length: number, rawPointer: number) {
        this.length = length
        this.rawPointer = rawPointer
    }

    free() {
        this.inUse = false
    }
}

class Heap {
    private pointers: Pointer[] = []
    private module: any

    constructor(module: any) {
        this.module = module
    }

    getCStringPointer(data: string) {
        let length = this.module.lengthBytesUTF8(data) + 1

        let existing = this.pointers.find(p => p.length >= length && !p.inUse)

        if (existing) {
            this.module.stringToUTF8(data, existing.rawPointer, length);
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
    private module: any = null
    private heap!: Heap

    async runGetMethod(args: GetMethodArgs): Promise<GetMethodResult> {
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
        };

        let stack = serializeTuple(args.stack)

        let result = await this.invoke('_run_get_method', [
            JSON.stringify(params),
            stack.toBoc().toString('base64'),
            args.config.toBoc().toString('base64')
        ])

        return JSON.parse(result) as GetMethodResult;
    }

    async runTransaction(args: RunTransactionArgs) {
        let params: EmulationInternalParams = {
            utime: args.now,
            lt: args.lt.toString(),
            rand_seed: args.randomSeed.toString('hex'),
            ignore_chksig: false
        }

        let config = this.heap.getCStringPointer(args.config.toBoc().toString('base64'))
        let verbosity = verbosityToNum[args.verbosity]

        let emulator = await this.invoke('_create_emulator', [config.rawPointer, verbosity])

        let res = await this.invoke('_emulate', [
            emulator,
            args.libs?.toBoc().toString('base64') ?? 0,
            args.shardAccount.toBoc().toString('base64'),
            args.message.toBoc().toString('base64'),
            JSON.stringify(params)
        ])

        return res
    }

    async invoke(method: string, args: (number | string)[]) {
        let module = await this.getModule()

        let pointers: Pointer[] = []

        const savePointer = (pointer: Pointer) => {
            pointers.push(pointer)
            return pointer.rawPointer
        }

        let mappedArgs = args.map(arg => {
            if (typeof arg === 'string') {
                return savePointer(this.heap.getCStringPointer(arg))
            } else {
                return arg
            }
        })

        let resPtr: number

        try {
            resPtr = savePointer(new Pointer(0, module[method](...mappedArgs)));
            return this.module.UTF8ToString(resPtr)
        } finally {
            this.module._free(resPtr!)
            pointers.forEach(p => p.free())
        }
    }

    private async getModule() {
        // TODO: handle race condition
        if (this.module !== null) {
            return this.module
        }

        this.module = await EmulatorModule({
            wasmBinary: base64Decode(require('./emulator-emscripten.wasm.js').EmulatorEmscriptenWasm),
            printErr: (text: string) => console.warn(text),
        });

        this.heap = new Heap(this.module)

        return this.module
    }
}