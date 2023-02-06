import { defaultConfig } from "../config/defaultConfig";
import {Address, Cell, Message, Transaction, ContractProvider, Contract, Sender, toNano, loadMessage, ShardAccount, TupleItem} from "ton-core";
import {Executor} from "../executor/Executor";
import {BlockchainStorage, LocalBlockchainStorage} from "./BlockchainStorage";
import { extractEvents, Event } from "../event/Event";
import { BlockchainContractProvider } from "./BlockchainContractProvider";
import { BlockchainSender } from "./BlockchainSender";
import { testKey } from "../utils/testKey";
import { TreasuryContract } from "../treasury/Treasury";
import { LogsVerbosity, Verbosity } from "./SmartContract";
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
    storage: BlockchainStorage
    private networkConfig: Cell
    #lt = 0n;
    readonly executor: Executor
    readonly messageQueue: Message[] = []
    #verbosity: LogsVerbosity = {
        blockchainLogs: false,
        vmLogs: 'none',
        debugLogs: true,
    }
    #lock = new AsyncLock()

    get lt() {
        return this.#lt
    }

    private constructor(opts: { executor: Executor, config?: Cell, storage: BlockchainStorage }) {
        this.networkConfig = opts.config ?? Cell.fromBoc(Buffer.from(defaultConfig, 'base64'))[0]
        this.executor = opts?.executor
        this.storage = opts.storage
    }

    get config(): Cell {
        return this.networkConfig
    }

    async sendMessage(message: Message | Cell): Promise<SendMessageResult> {
        await this.pushMessage(message)
        return await this.runQueue()
    }

    async runGetMethod(address: Address, method: number | string, stack: TupleItem[] = []) {
        return (await this.getContract(address)).get(method, stack)
    }

    private async pushMessage(message: Message | Cell) {
        const msg = message instanceof Cell ? loadMessage(message.beginParse()) : message
        if (msg.info.type === 'external-out') {
            throw new Error('Cannot send external out message')
        }
        await this.#lock.with(async () => {
            this.messageQueue.push(msg)
        })
    }

    private async runQueue(): Promise<SendMessageResult>  {
        const txes = await this.processQueue()
        return {
            transactions: txes,
            events: txes.map(tx => extractEvents(tx)).flat(),
        }
    }

    private async processQueue() {
        return await this.#lock.with(async () => {
            let result: Transaction[] = []

            while (this.messageQueue.length > 0) {
                let message = this.messageQueue.shift()!

                if (message.info.type === 'external-out') {
                    continue
                }

                this.#lt += LT_ALIGN
                let transaction = await (await this.getContract(message.info.dest)).receiveMessage(message)

                result.push(transaction)

                for (let message of transaction.outMessages.values()) {
                    this.messageQueue.push(message)
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

    async getContract(address: Address) {
        return await this.storage.getContract(this, address)
    }

    get verbosity() {
        return this.#verbosity
    }

    set verbosity(value: LogsVerbosity) {
        this.#verbosity = value
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

    static async create(opts?: { config?: Cell, storage?: BlockchainStorage }) {
        return new Blockchain({
            executor: await Executor.create(),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}