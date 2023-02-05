import {Blockchain} from "./Blockchain";
import {
    Account,
    Address,
    beginCell,
    Cell,
    contractAddress, loadShardAccount, loadTransaction,
    Message,
    parseTuple,
    ShardAccount,
    storeMessage, storeShardAccount,
    TupleItem, TupleReader
} from "ton-core";
import {getSelectorForMethod} from "../utils/selector";
import { ExecutorVerbosity } from "../executor/Executor";

export function createShardAccount(args: { address?: Address, code: Cell, data: Cell, balance: bigint, workchain?: number }): ShardAccount {
    let wc = args.workchain ?? 0
    let address = args.address ?? contractAddress(wc, { code: args.code, data: args.data })
    let balance = args.balance ?? 0n

    return {
        account: {
            addr: address,
            storage: {
                lastTransLt: 0n,
                balance: { coins: balance },
                state: {
                    type: 'active',
                    state: {
                        code: args.code,
                        data: args.data
                    }
                }
            },
            storageStats: {
                used: {
                    cells: 0n,
                    bits: 0n,
                    publicCells: 0n
                },
                lastPaid: 0,
                duePayment: null
            }
        },
        lastTransactionLt: 0n,
        lastTransactionHash: 0n
    }
}

function createEmptyAccount(address: Address): Account {
    return {
        addr: address,
        storage: {
            lastTransLt: 0n,
            balance: { coins: 0n },
            state: { type: 'uninit' }
        },
        storageStats: {
            used: { cells: 0n, bits: 0n, publicCells: 0n },
            lastPaid: 0,
        }
    }
}

export function createEmptyShardAccount(address: Address): ShardAccount {
    return {
        account: createEmptyAccount(address),
        lastTransactionLt: 0n,
        lastTransactionHash: 0n
    }
}

export type Verbosity = 'none' | 'vm_logs' | 'vm_logs_full'

const verbosityToExecutorVerbosity: Record<Verbosity, ExecutorVerbosity> = {
    'none': 'short',
    'vm_logs': 'full',
    'vm_logs_full': 'full_location_stack',
}

export type LogsVerbosity = {
    blockchainLogs: boolean
    vmLogs: Verbosity
    debugLogs: boolean
}

export class SmartContract {
    readonly address: Address;
    readonly blockchain: Blockchain
    #account: ShardAccount
    #verbosity?: Partial<LogsVerbosity>

    constructor(shardAccount: ShardAccount, blockchain: Blockchain) {
        this.address = shardAccount.account!.addr
        this.#account = shardAccount
        this.blockchain = blockchain
    }

    get balance() {
        return this.#account.account?.storage.balance.coins ?? 0n
    }

    set balance(v: bigint) {
        if (!this.#account.account) {
            this.#account.account = createEmptyAccount(this.address)
        }
        this.#account.account.storage.balance.coins = v
    }

    get lastTransactionHash() {
        return this.#account.lastTransactionHash
    }

    get lastTransactionLt() {
        return this.#account.lastTransactionLt
    }

    get accountState() {
        return this.#account.account?.storage.state
    }

    get account() {
        return this.#account
    }

    set account(account: ShardAccount) {
        this.#account = account
    }

    static create(blockchain: Blockchain, args: { address: Address, code: Cell, data: Cell, balance: bigint }) {
        return new SmartContract(createShardAccount(args), blockchain)
    }

    static empty(blockchain: Blockchain, address: Address) {
        return new SmartContract(createEmptyShardAccount(address), blockchain)
    }

    receiveMessage(message: Message) {
        const messageCell = beginCell().store(storeMessage(message)).endCell()
        const shardAccount = beginCell().store(storeShardAccount(this.#account)).endCell()

        const res = this.blockchain.executor.runTransaction({
            config: this.blockchain.config,
            libs: null,
            verbosity: verbosityToExecutorVerbosity[this.verbosity.vmLogs],
            shardAccount,
            message: messageCell,
            now: Math.floor(Date.now() / 1000),
            lt: this.blockchain.lt,
            randomSeed: Buffer.alloc(32)
        })

        if (this.verbosity.blockchainLogs && res.logs.length > 0) {
            console.log(res.logs)
        }

        if (!res.result.success) {
            console.error('Error:', res.result.error, 'VM logs', res.result.vmResults)
            throw new Error('Error executing transaction')
        }

        if (this.verbosity.vmLogs !== 'none' && res.result.vmLog.length > 0) {
            console.log(res.result.vmLog)
        }

        if (this.verbosity.debugLogs && res.debugLogs.length > 0) {
            console.log(res.debugLogs)
        }

        this.#account = loadShardAccount(Cell.fromBase64(res.result.shardAccount).beginParse())

        return loadTransaction(Cell.fromBase64(res.result.transaction).beginParse())
    }

    get(method: string | number, stack: TupleItem[] = []) {
        if (this.#account.account?.storage.state.type !== 'active') {
            throw new Error('Trying to run get method on non-active contract')
        }

        const res = this.blockchain.executor.runGetMethod({
            code: this.#account.account?.storage.state.state.code!,
            data: this.#account.account?.storage.state.state.data!,
            methodId: typeof method === 'string' ? getSelectorForMethod(method) : method,
            stack,
            config: this.blockchain.config,
            verbosity: verbosityToExecutorVerbosity[this.verbosity.vmLogs],
            libs: undefined,
            address: this.address,
            unixTime: Math.floor(Date.now() / 1000),
            balance: this.balance,
            randomSeed: Buffer.alloc(32),
            gasLimit: 10_000_000n
        })

        if (this.verbosity.blockchainLogs && res.logs.length > 0) {
            console.log(res.logs)
        }

        if (!res.output.success) {
            throw new Error('Error invoking get method: ' + res.output.error)
        }

        if (this.verbosity.vmLogs !== 'none' && res.output.vm_log.length > 0) {
            console.log(res.output.vm_log)
        }

        if (this.verbosity.debugLogs && res.debugLogs.length > 0) {
            console.log(res.debugLogs)
        }

        const resStack = parseTuple(Cell.fromBase64(res.output.stack))

        return {
            stack: resStack,
            stackReader: new TupleReader(resStack),
            exitCode: res.output.vm_exit_code,
            gasUsed: res.output.gas_used,
            logs: res.output.vm_log
        }
    }

    get verbosity() {
        return {
            ...this.blockchain.verbosity,
            ...this.#verbosity,
        }
    }

    set verbosity(value: LogsVerbosity) {
        this.setVerbosity(value)
    }

    setVerbosity(verbosity: Partial<LogsVerbosity> | undefined) {
        this.#verbosity = verbosity
    }
}