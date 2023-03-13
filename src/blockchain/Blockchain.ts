import { defaultConfig } from "../config/defaultConfig";
import {Address, Cell, Message, Transaction, ContractProvider, Contract, Sender, toNano, loadMessage, ShardAccount, TupleItem} from "ton-core";
import {Executor} from "../executor/Executor";
import {BlockchainStorage, LocalBlockchainStorage} from "./BlockchainStorage";
import { extractEvents, Event } from "../event/Event";
import { BlockchainContractProvider } from "./BlockchainContractProvider";
import { BlockchainSender } from "./BlockchainSender";
import { testKey } from "../utils/testKey";
import { TreasuryContract } from "../treasury/Treasury";
import { GetMethodParams, LogsVerbosity, MessageParams, SmartContract, Verbosity } from "./SmartContract";
import { AsyncLock } from "../utils/AsyncLock";
import { internal } from "../utils/message";

const LT_ALIGN = 1000000n

export type BlockchainTransaction = Transaction & {
    blockchainLogs: string,
    vmLogs: string,
    debugLogs: string,
    events: Event[],
    parent?: BlockchainTransaction,
    children: BlockchainTransaction[],
}

export type SendMessageResult = {
    transactions: BlockchainTransaction[],
    events: Event[],
}

export type SandboxContract<F> = {
    [P in keyof F]: P extends `get${string}`
        ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never)
        : (P extends `send${string}`
            ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => Promise<SendMessageResult & {
                result: R extends Promise<infer PR> ? PR : R
            }> : never)
            : F[P]);
}

export type PendingMessage = Message & {
    parentTransaction?: BlockchainTransaction,
}

export type TreasuryParams = Partial<{
    workchain: number,
    predeploy: boolean,
    balance: bigint,
    resetBalanceIfZero: boolean,
}>

const TREASURY_INIT_BALANCE_TONS = 1_000_000

export class Blockchain {
    protected storage: BlockchainStorage
    protected networkConfig: Cell
    protected currentLt = 0n
    protected currentTime?: number
    protected messageQueue: PendingMessage[] = []
    protected logsVerbosity: LogsVerbosity = {
        print: true,
        blockchainLogs: false,
        vmLogs: 'none',
        debugLogs: true,
    }
    protected globalLibs?: Cell
    protected lock = new AsyncLock()
    protected contractFetches = new Map<string, Promise<SmartContract>>()

    readonly executor: Executor

    get now() {
        return this.currentTime
    }

    set now(now: number | undefined) {
        this.currentTime = now
    }

    get lt() {
        return this.currentLt
    }

    protected constructor(opts: { executor: Executor, config?: Cell, storage: BlockchainStorage }) {
        this.networkConfig = opts.config ?? Cell.fromBase64(defaultConfig)
        this.executor = opts.executor
        this.storage = opts.storage
    }

    get config(): Cell {
        return this.networkConfig
    }

    async sendMessage(message: Message | Cell, params?: MessageParams): Promise<SendMessageResult> {
        await this.pushMessage(message)
        return await this.runQueue(params)
    }

    async runGetMethod(address: Address, method: number | string, stack: TupleItem[] = [], params?: GetMethodParams) {
        return (await this.getContract(address)).get(method, stack, {
            now: this.now,
            ...params,
        })
    }

    protected async pushMessage(message: Message | Cell) {
        const msg = message instanceof Cell ? loadMessage(message.beginParse()) : message
        if (msg.info.type === 'external-out') {
            throw new Error('Cannot send external out message')
        }
        await this.lock.with(async () => {
            this.messageQueue.push(msg)
        })
    }

    protected async runQueue(params?: MessageParams): Promise<SendMessageResult>  {
        const txes = await this.processQueue(params)
        return {
            transactions: txes,
            events: txes.map(tx => tx.events).flat(),
        }
    }

    protected async processQueue(params?: MessageParams) {
        params = {
            now: this.now,
            ...params,
        }
        return await this.lock.with(async () => {
            const result: BlockchainTransaction[] = []

            while (this.messageQueue.length > 0) {
                const message = this.messageQueue.shift()!

                if (message.info.type === 'external-out') {
                    continue
                }

                this.currentLt += LT_ALIGN
                const smcTx = await (await this.getContract(message.info.dest)).receiveMessage(message, params)
                const transaction: BlockchainTransaction = {
                    ...smcTx,
                    events: extractEvents(smcTx),
                    parent: message.parentTransaction,
                    children: [],
                }
                transaction.parent?.children.push(transaction)

                result.push(transaction)

                for (let message of transaction.outMessages.values()) {
                    this.messageQueue.push({
                        ...message,
                        parentTransaction: transaction,
                    })

                    if (message.info.type === 'internal') {
                        this.startFetchingContract(message.info.dest)
                    }
                }
            }

            return result
        })
    }

    provider(address: Address, init?: { code: Cell, data: Cell }): ContractProvider {
        return new BlockchainContractProvider({
            getContract: (addr) => this.getContract(addr),
            pushMessage: (msg) => this.pushMessage(msg),
        }, address, init)
    }

    sender(address: Address): Sender {
        return new BlockchainSender({
            pushMessage: (msg) => this.pushMessage(msg),
        }, address)
    }

    async treasury(seed: string, params?: TreasuryParams) {
        const key = testKey(seed)
        const treasury = TreasuryContract.create(params?.workchain ?? 0, key)
        const wallet = this.openContract(treasury)

        const contract = await this.getContract(treasury.address)
        if ((params?.predeploy ?? true) && (contract.accountState === undefined || contract.accountState.type === 'uninit')) {
            await this.sendMessage(internal({
                from: new Address(0, Buffer.alloc(32)),
                to: wallet.address,
                value: toNano(1),
                stateInit: wallet.init,
            }))
            contract.balance = params?.balance ?? toNano(TREASURY_INIT_BALANCE_TONS)
        } else if ((params?.resetBalanceIfZero ?? true) && contract.balance === 0n) {
            contract.balance = params?.balance ?? toNano(TREASURY_INIT_BALANCE_TONS)
        }

        return wallet
    }

    openContract<T extends Contract>(contract: T) {
        let address: Address;
        let init: { code: Cell, data: Cell } | undefined = undefined;

        if (!Address.isAddress(contract.address)) {
            throw Error('Invalid address');
        }
        address = contract.address;
        if (contract.init) {
            if (!(contract.init.code instanceof Cell)) {
                throw Error('Invalid init.code');
            }
            if (!(contract.init.data instanceof Cell)) {
                throw Error('Invalid init.data');
            }
            init = contract.init;
        }

        const provider = this.provider(address, init)
        const blkch = this

        return new Proxy<any>(contract as any, {
            get(target, prop) {
                const value = target[prop]
                if (typeof prop === 'string' && typeof value === 'function') {
                    if (prop.startsWith('get')) {
                        return (...args: any[]) => value.apply(target, [provider, ...args])
                    } else if (prop.startsWith('send')) {
                        return async (...args: any[]) => {
                            const ret = value.apply(target, [provider, ...args])
                            if (ret instanceof Promise) {
                                const r = await ret
                                return {
                                    ...await blkch.runQueue(),
                                    result: r,
                                }
                            } else {
                                return {
                                    ...await blkch.runQueue(),
                                    result: ret,
                                }
                            }
                        }
                    }
                }
                return value
            }
        }) as SandboxContract<T>;
    }

    protected startFetchingContract(address: Address) {
        const addrString = address.toRawString()
        let promise = this.contractFetches.get(addrString)
        if (promise !== undefined) {
            return promise
        }
        promise = this.storage.getContract(this, address)
        this.contractFetches.set(addrString, promise)
        return promise
    }

    async getContract(address: Address) {
        const contract = await this.startFetchingContract(address)
        this.contractFetches.delete(address.toRawString())
        return contract
    }

    get verbosity() {
        return this.logsVerbosity
    }

    set verbosity(value: LogsVerbosity) {
        this.logsVerbosity = value
    }

    async setVerbosityForAddress(address: Address, verbosity: Partial<LogsVerbosity> | Verbosity | undefined) {
        const contract = await this.getContract(address)
        contract.setVerbosity(verbosity)
    }

    setConfig(config: Cell) {
        this.networkConfig = config
    }

    async setShardAccount(address: Address, account: ShardAccount) {
        const contract = await this.getContract(address)
        contract.account = account
    }

    get libs() {
        return this.globalLibs
    }

    set libs(value: Cell | undefined) {
        this.globalLibs = value
    }

    static async create(opts?: { config?: Cell, storage?: BlockchainStorage }) {
        return new Blockchain({
            executor: await Executor.create(),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}