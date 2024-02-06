import { defaultConfig } from "../config/defaultConfig";
import {Address, Cell, Message, Transaction, ContractProvider, Contract, Sender, toNano, loadMessage, ShardAccount, TupleItem, ExternalAddress, StateInit} from "@ton/core";
import {Executor, TickOrTock} from "../executor/Executor";
import {BlockchainStorage, LocalBlockchainStorage} from "./BlockchainStorage";
import { extractEvents, Event } from "../event/Event";
import { BlockchainContractProvider, SandboxContractProvider } from "./BlockchainContractProvider";
import { BlockchainSender } from "./BlockchainSender";
import { TreasuryContract } from "../treasury/Treasury";
import { GetMethodParams, LogsVerbosity, MessageParams, SmartContract, SmartContractSnapshot, SmartContractTransaction, Verbosity } from "./SmartContract";
import { AsyncLock } from "../utils/AsyncLock";
import { internal } from "../utils/message";
import { slimConfig } from "../config/slimConfig";
import { testSubwalletId } from "../utils/testTreasurySubwalletId";

const CREATE_WALLETS_PREFIX = 'CREATE_WALLETS'

function createWalletsSeed(idx: number) {
    return `${CREATE_WALLETS_PREFIX}${idx}`
}

const LT_ALIGN = 1000000n

export type ExternalOutInfo = {
    type: 'external-out'
    src: Address
    dest?: ExternalAddress
    createdAt: number
    createdLt: bigint
}

export type ExternalOut = {
    info: ExternalOutInfo
    init?: StateInit
    body: Cell
}

export type BlockchainTransaction = Transaction & {
    blockchainLogs: string,
    vmLogs: string,
    debugLogs: string,
    events: Event[],
    parent?: BlockchainTransaction,
    children: BlockchainTransaction[],
    externals: ExternalOut[],
}

export type SendMessageResult = {
    transactions: BlockchainTransaction[],
    events: Event[],
    externals: ExternalOut[],
}

type ExtendsContractProvider<T> = T extends ContractProvider ? true : (T extends SandboxContractProvider ? true : false);

export type SandboxContract<F> = {
    [P in keyof F]: P extends `get${string}`
        ? (F[P] extends (x: infer CP, ...args: infer P) => infer R ? (ExtendsContractProvider<CP> extends true ? (...args: P) => R : never) : never)
        : (P extends `send${string}`
            ? (F[P] extends (x: infer CP, ...args: infer P) => infer R ? (ExtendsContractProvider<CP> extends true ? (...args: P) => Promise<SendMessageResult & {
                result: R extends Promise<infer PR> ? PR : R
            }> : never) : never)
            : F[P]);
}

export type PendingMessage = (({
    type: 'message',
} & Message) | ({
    type: 'ticktock',
    which: TickOrTock,
    on: Address,
})) & {
    parentTransaction?: BlockchainTransaction,
}

export type TreasuryParams = Partial<{
    workchain: number,
    predeploy: boolean,
    balance: bigint,
    resetBalanceIfZero: boolean,
}>

const TREASURY_INIT_BALANCE_TONS = 1_000_000

export type BlockchainConfig = Cell | 'default' | 'slim'

function blockchainConfigToBase64(config: BlockchainConfig | undefined): string {
    switch (config) {
        case 'default':
            return defaultConfig
        case 'slim':
            return slimConfig
        default:
            return config?.toBoc({ idx: false }).toString('base64') ?? defaultConfig
    }
}

export type BlockchainSnapshot = {
    contracts: SmartContractSnapshot[]
    networkConfig: string
    lt: bigint
    time?: number
    verbosity: LogsVerbosity
    libs?: Cell
    nextCreateWalletIndex: number
}

export class Blockchain {
    protected storage: BlockchainStorage
    protected networkConfig: string
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
    protected nextCreateWalletIndex = 0

    readonly executor: Executor

    snapshot(): BlockchainSnapshot {
        return {
            contracts: this.storage.knownContracts().map(s => s.snapshot()),
            networkConfig: this.networkConfig,
            lt: this.currentLt,
            time: this.currentTime,
            verbosity: { ...this.logsVerbosity },
            libs: this.globalLibs,
            nextCreateWalletIndex: this.nextCreateWalletIndex,
        }
    }

    async loadFrom(snapshot: BlockchainSnapshot) {
        this.storage.clearKnownContracts()
        for (const contract of snapshot.contracts) {
            const storageContract = await this.getContract(contract.address)
            storageContract.loadFrom(contract)
        }

        this.networkConfig = snapshot.networkConfig
        this.currentLt = snapshot.lt
        this.currentTime = snapshot.time
        this.logsVerbosity = { ...snapshot.verbosity }
        this.globalLibs = snapshot.libs
        this.nextCreateWalletIndex = snapshot.nextCreateWalletIndex
    }

    get now() {
        return this.currentTime
    }

    set now(now: number | undefined) {
        this.currentTime = now
    }

    get lt() {
        return this.currentLt
    }

    protected constructor(opts: { executor: Executor, config?: BlockchainConfig, storage: BlockchainStorage }) {
        this.networkConfig = blockchainConfigToBase64(opts.config)
        this.executor = opts.executor
        this.storage = opts.storage
    }

    get config(): Cell {
        return Cell.fromBase64(this.networkConfig)
    }

    get configBase64(): string {
        return this.networkConfig
    }

    async sendMessage(message: Message | Cell, params?: MessageParams): Promise<SendMessageResult> {
        await this.pushMessage(message)
        return await this.runQueue(params)
    }

    async sendMessageIter(message: Message | Cell, params?: MessageParams): Promise<AsyncIterator<BlockchainTransaction> & AsyncIterable<BlockchainTransaction>> {
        params = {
            now: this.now,
            ...params,
        }

        await this.pushMessage(message)
        // Iterable will lock on per tx basis
        return await this.txIter(true, params)
    }

    async runTickTock(on: Address | Address[], which: TickOrTock, params?: MessageParams): Promise<SendMessageResult> {
        for (const addr of (Array.isArray(on) ? on : [on])) {
            await this.pushTickTock(addr, which)
        }
        return await this.runQueue(params)
    }

    async runGetMethod(address: Address, method: number | string, stack: TupleItem[] = [], params?: GetMethodParams) {
        return await (await this.getContract(address)).get(method, stack, {
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
            this.messageQueue.push({
                type: 'message',
                ...msg,
            })
        })
    }

    protected async pushTickTock(on: Address, which: TickOrTock) {
        await this.lock.with(async () => {
            this.messageQueue.push({
                type: 'ticktock',
                on,
                which,
            })
        })
    }

    protected async runQueue(params?: MessageParams): Promise<SendMessageResult>  {
        const txes = await this.processQueue(params)
        return {
            transactions: txes,
            events: txes.map(tx => tx.events).flat(),
            externals: txes.map(tx => tx.externals).flat(),
        }
    }

    protected txIter(needsLocking: boolean, params?: MessageParams): AsyncIterator<BlockchainTransaction> & AsyncIterable<BlockchainTransaction> {
        const it = { next: () => this.processTx(needsLocking, params), [Symbol.asyncIterator]() { return it; } }
        return it;
    }

    protected async processInternal(params?: MessageParams): Promise<IteratorResult<BlockchainTransaction>> {
        let result: BlockchainTransaction | undefined = undefined
        let done = this.messageQueue.length == 0
        while (!done) {
            const message = this.messageQueue.shift()!

            let tx: SmartContractTransaction
            if (message.type === 'message') {
                if (message.info.type === 'external-out') {
                    done = this.messageQueue.length == 0
                    continue
                }

                this.currentLt += LT_ALIGN
                tx = await (await this.getContract(message.info.dest)).receiveMessage(message, params)
            } else {
                this.currentLt += LT_ALIGN
                tx = await (await this.getContract(message.on)).runTickTock(message.which, params)
            }

            const transaction: BlockchainTransaction = {
                ...tx,
                events: extractEvents(tx),
                parent: message.parentTransaction,
                children: [],
                externals: [],
            }
            transaction.parent?.children.push(transaction)

            result = transaction
            done = true

            for (const message of transaction.outMessages.values()) {
                if (message.info.type === 'external-out') {
                    transaction.externals.push({
                        info: {
                            type: 'external-out',
                            src: message.info.src,
                            dest: message.info.dest ?? undefined,
                            createdAt: message.info.createdAt,
                            createdLt: message.info.createdLt,
                        },
                        init: message.init ?? undefined,
                        body: message.body,
                    })
                    continue
                }

                this.messageQueue.push({
                    type: 'message',
                    parentTransaction: transaction,
                    ...message,
                })

                if (message.info.type === 'internal') {
                    this.startFetchingContract(message.info.dest)
                }
            }

        }
        return result === undefined ? { value: result, done: true } : { value: result, done: false }
    }

    protected async processTx(needsLocking: boolean, params?: MessageParams): Promise<IteratorResult<BlockchainTransaction>> {
        // Lock only if not locked already
        return needsLocking ? await this.lock.with(async () => this.processInternal(params)) : await this.processInternal(params)
    }

    protected async processQueue(params?: MessageParams) {
        params = {
            now: this.now,
            ...params,
        }
        return await this.lock.with(async () => {
            // Locked already
            const txs = this.txIter(false, params)
            const result: BlockchainTransaction[] = []

            for await (const tx of txs) {
                result.push(tx)
            }

            return result
        })
    }

    provider(address: Address, init?: { code: Cell, data: Cell }): ContractProvider {
        return new BlockchainContractProvider({
            getContract: (addr) => this.getContract(addr),
            pushMessage: (msg) => this.pushMessage(msg),
            runGetMethod: (addr, method, args) => this.runGetMethod(addr, method, args),
            pushTickTock: (on, which) => this.pushTickTock(on, which),
        }, address, init)
    }

    sender(address: Address): Sender {
        return new BlockchainSender({
            pushMessage: (msg) => this.pushMessage(msg),
        }, address)
    }

    protected treasuryParamsToMapKey(workchain: number, seed: string) {
        return `${workchain}:${seed}`
    }

    async treasury(seed: string, params?: TreasuryParams) {
        const subwalletId = testSubwalletId(seed)
        const wallet = this.openContract(TreasuryContract.create(params?.workchain ?? 0, subwalletId))

        const contract = await this.getContract(wallet.address)
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

    async createWallets(n: number, params?: TreasuryParams) {
        const wallets: SandboxContract<TreasuryContract>[] = []
        for (let i = 0; i < n; i++) {
            const seed = createWalletsSeed(this.nextCreateWalletIndex++)
            wallets.push(await this.treasury(seed, params))
        }
        return wallets
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
        try {
            const contract = await this.startFetchingContract(address)
            return contract
        } catch (e) {
            throw e
        } finally {
            this.contractFetches.delete(address.toRawString())
        }
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

    setConfig(config: BlockchainConfig) {
        this.networkConfig = blockchainConfigToBase64(config)
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

    static async create(opts?: { config?: BlockchainConfig, storage?: BlockchainStorage }) {
        return new Blockchain({
            executor: await Executor.create(),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}