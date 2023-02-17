import { defaultConfig } from "../config/defaultConfig";
import {Address, Cell, Message, Transaction, ContractProvider, Contract, Sender, toNano, loadMessage, ShardAccount, TupleItem} from "ton-core";
import {Executor} from "../executor/Executor";
import {BlockchainStorage, LocalBlockchainStorage} from "./BlockchainStorage";
import { extractEvents, Event } from "../event/Event";
import { BlockchainContractProvider } from "./BlockchainContractProvider";
import { BlockchainSender } from "./BlockchainSender";
import { testKey } from "../utils/testKey";
import { TreasuryContract } from "../treasury/Treasury";
import { LogsVerbosity, SmartContract, Verbosity } from "./SmartContract";
import { AsyncLock } from "../utils/AsyncLock";
import { internal } from "../utils/message";

const LT_ALIGN = 1000000n

export type SendMessageResult = {
    transactions: Transaction[],
    events: Event[],
}

export type OpenedContract<F> = {
    [P in keyof F]: P extends `get${string}`
        ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => R : never)
        : (P extends `send${string}`
            ? (F[P] extends (x: ContractProvider, ...args: infer P) => infer R ? (...args: P) => Promise<SendMessageResult & {
                result: R extends Promise<infer PR> ? PR : R
            }> : never)
            : F[P]);
}

export class Blockchain {
    protected _storage: BlockchainStorage
    protected _networkConfig: Cell
    protected _lt = 0n;
    protected _executor: Executor
    protected _messageQueue: Message[] = []
    protected _verbosity: LogsVerbosity = {
        blockchainLogs: false,
        vmLogs: 'none',
        debugLogs: true,
    }
    protected _lock = new AsyncLock()
    protected _contractFetches = new Map<string, Promise<SmartContract>>()

    get lt() {
        return this._lt
    }

    get executor() {
        return this._executor
    }

    protected constructor(opts: { executor: Executor, config?: Cell, storage: BlockchainStorage }) {
        this._networkConfig = opts.config ?? Cell.fromBase64(defaultConfig)
        this._executor = opts.executor
        this._storage = opts.storage
    }

    get config(): Cell {
        return this._networkConfig
    }

    async sendMessage(message: Message | Cell): Promise<SendMessageResult> {
        await this.pushMessage(message)
        return await this.runQueue()
    }

    async runGetMethod(address: Address, method: number | string, stack: TupleItem[] = []) {
        return (await this.getContract(address)).get(method, stack)
    }

    protected async pushMessage(message: Message | Cell) {
        const msg = message instanceof Cell ? loadMessage(message.beginParse()) : message
        if (msg.info.type === 'external-out') {
            throw new Error('Cannot send external out message')
        }
        await this._lock.with(async () => {
            this._messageQueue.push(msg)
        })
    }

    protected async runQueue(): Promise<SendMessageResult>  {
        const txes = await this.processQueue()
        return {
            transactions: txes,
            events: txes.map(tx => extractEvents(tx)).flat(),
        }
    }

    protected async processQueue() {
        return await this._lock.with(async () => {
            let result: Transaction[] = []

            while (this._messageQueue.length > 0) {
                let message = this._messageQueue.shift()!

                if (message.info.type === 'external-out') {
                    continue
                }

                this._lt += LT_ALIGN
                let transaction = await (await this.getContract(message.info.dest)).receiveMessage(message)

                result.push(transaction)

                for (let message of transaction.outMessages.values()) {
                    this._messageQueue.push(message)

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

    async treasury(seed: string, workchain: number = 0) {
        const key = testKey(seed)
        const treasury = TreasuryContract.create(workchain, key)
        const wallet = this.openContract(treasury)

        const contract = await this.getContract(treasury.address)
        if (contract.accountState === undefined || contract.accountState.type === 'uninit') {
            await this.sendMessage(internal({
                from: new Address(0, Buffer.alloc(32)),
                to: wallet.address,
                value: toNano(1),
                stateInit: wallet.init,
            }))
            contract.balance = toNano(1_000_000)
        } else if (contract.balance === 0n) {
            contract.balance = toNano(1_000_000)
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
        }) as OpenedContract<T>;
    }

    protected startFetchingContract(address: Address) {
        const addrString = address.toRawString()
        let promise = this._contractFetches.get(addrString)
        if (promise !== undefined) {
            return promise
        }
        promise = this._storage.getContract(this, address)
        this._contractFetches.set(addrString, promise)
        return promise
    }

    async getContract(address: Address) {
        const contract = await this.startFetchingContract(address)
        this._contractFetches.delete(address.toRawString())
        return contract
    }

    get verbosity() {
        return this._verbosity
    }

    set verbosity(value: LogsVerbosity) {
        this._verbosity = value
    }

    async setVerbosityForAddress(address: Address, verbosity: Partial<LogsVerbosity> | Verbosity | undefined) {
        const contract = await this.getContract(address)
        contract.setVerbosity(verbosity)
    }

    setConfig(config: Cell) {
        this._networkConfig = config
    }

    async setShardAccount(address: Address, account: ShardAccount) {
        const contract = await this.getContract(address)
        contract.account = account
    }

    static async create(opts?: { config?: Cell, storage?: BlockchainStorage }) {
        return new Blockchain({
            executor: await Executor.create(),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}