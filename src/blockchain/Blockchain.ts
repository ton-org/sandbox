import {
    Address,
    Cell,
    Message,
    ContractProvider,
    Contract,
    Sender,
    toNano,
    ShardAccount,
    TupleItem,
    ExternalAddress,
    StateInit,
    OpenedContract,
} from '@ton/core';
import { getSecureRandomBytes } from '@ton/crypto';

import { defaultConfig } from '../config/defaultConfig';
import { IExecutor, Executor, TickOrTock, PrevBlocksInfo } from '../executor/Executor';
import { BlockchainStorage, LocalBlockchainStorage } from './BlockchainStorage';
import { Event } from '../event/Event';
import { BlockchainContractProvider, SandboxContractProvider } from './BlockchainContractProvider';
import { BlockchainSender } from './BlockchainSender';
import { TreasuryContract } from '../treasury/Treasury';
import {
    GetMethodParams,
    GetMethodResult,
    LogsVerbosity,
    MessageParams,
    SmartContract,
    SmartContractSnapshot,
    SmartContractTransaction,
    Verbosity,
} from './SmartContract';
import { internal } from '../utils/message';
import { slimConfig } from '../config/slimConfig';
import { testSubwalletId } from '../utils/testTreasurySubwalletId';
import { collectMetric } from '../metric/collectMetric';
import { ContractsMeta } from '../meta/ContractsMeta';
import { deepcopy, deepcopyTransactions, restoreTransactions } from '../utils/deepcopy';
import { collectAsmCoverage, collectTxsCoverage, mergeCoverages, Coverage } from '../coverage';
import { MessageQueueManager } from './MessageQueueManager';
import { AsyncLock } from '../utils/AsyncLock';

const CREATE_WALLETS_PREFIX = 'CREATE_WALLETS';

function createWalletsSeed(idx: number) {
    return `${CREATE_WALLETS_PREFIX}${idx}`;
}

const LT_ALIGN = 1000000n;

export type ExternalOutInfo = {
    type: 'external-out';
    src: Address;
    dest?: ExternalAddress;
    createdAt: number;
    createdLt: bigint;
};

export type ExternalOut = {
    info: ExternalOutInfo;
    init?: StateInit;
    body: Cell;
};

export type BlockchainTransaction = SmartContractTransaction & {
    events: Event[];
    parent?: BlockchainTransaction;
    children: BlockchainTransaction[];
    externals: ExternalOut[];
    mode?: number;
};

/**
 * @type SendMessageResult Represents the result of sending a message.
 * @property {BlockchainTransaction[]} transactions Array of blockchain transactions.
 * @property {Event[]} events Array of blockchain events.
 * @property {ExternalOut[]} externals - Array of external messages.
 */
export type SendMessageResult = {
    transactions: BlockchainTransaction[];
    events: Event[];
    externals: ExternalOut[];
};

type ExtendsContractProvider<T> = T extends ContractProvider ? true : T extends SandboxContractProvider ? true : false;

export const SANDBOX_CONTRACT_SYMBOL = Symbol('SandboxContract');

/**
 * @type SandboxContract Represents a sandbox contract.
 * @template F Type parameter representing the original contract object.
 */
export type SandboxContract<F> = {
    [P in keyof F]: P extends `${'get' | 'is'}${string}`
        ? F[P] extends (x: infer CP, ...args: infer P) => infer R
            ? ExtendsContractProvider<CP> extends true
                ? (...args: P) => R
                : never
            : never
        : P extends `send${string}`
          ? F[P] extends (x: infer CP, ...args: infer P) => infer R
              ? ExtendsContractProvider<CP> extends true
                  ? (...args: P) => Promise<
                        SendMessageResult & {
                            result: R extends Promise<infer PR> ? PR : R;
                        }
                    >
                  : never
              : never
          : F[P];
};

/**
 * Provide way to check if contract is in sandbox environment.
 * @param contract Any open contract
 * @throws Error if contract not a sandbox contract
 */
export function toSandboxContract<T>(contract: OpenedContract<T>): SandboxContract<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((contract as any)[SANDBOX_CONTRACT_SYMBOL] === true) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return contract as any;
    }

    throw new Error('Invalid contract: not a sandbox contract');
}

export type PendingMessage = (
    | ({
          type: 'message';
          mode?: number;
      } & Message)
    | {
          type: 'ticktock';
          which: TickOrTock;
          on: Address;
      }
) & {
    parentTransaction?: BlockchainTransaction;
};

/**
 * @type TreasuryParams Parameters for configuring a treasury contract.
 * @property {number} workchain The workchain ID of the treasury.
 * @property {boolean} predeploy If set the treasury will be deployed on the moment of creation.
 * @property {bigint} balance Initial balance of the treasury. If omitted 1_000_000 is used.
 * @property {boolean} resetBalanceIfZero If set and treasury balance is zero on moment of calling method it reset balance to {@link balance}.
 */
export type TreasuryParams = Partial<{
    workchain: number;
    predeploy: boolean;
    balance: bigint;
    resetBalanceIfZero: boolean;
}>;

const TREASURY_INIT_BALANCE_TONS = 1_000_000;

export type BlockchainConfig = Cell | 'default' | 'slim';

function blockchainConfigToBase64(config: BlockchainConfig | undefined): string {
    switch (config) {
        case 'default':
            return defaultConfig;
        case 'slim':
            return slimConfig;
        default:
            return config?.toBoc({ idx: false }).toString('base64') ?? defaultConfig;
    }
}

export type BlockchainSnapshot = {
    contracts: SmartContractSnapshot[];
    networkConfig: string;
    lt: bigint;
    time?: number;
    verbosity: LogsVerbosity;
    libs?: Cell;
    nextCreateWalletIndex: number;
    prevBlocksInfo?: PrevBlocksInfo;
    randomSeed?: Buffer;
    autoDeployLibs: boolean;
    transactions: BlockchainTransaction[];
};

export type SendMessageIterParams = MessageParams & {
    allowParallel?: boolean;
};

export class Blockchain {
    protected lock = new AsyncLock();

    protected storage: BlockchainStorage;
    protected networkConfig: string;
    protected currentLt = 0n;
    protected currentTime?: number;
    protected logsVerbosity: LogsVerbosity = {
        print: true,
        blockchainLogs: false,
        vmLogs: 'none',
        debugLogs: true,
    };
    protected globalLibs?: Cell;
    protected contractFetches = new Map<string, Promise<SmartContract>>();
    protected nextCreateWalletIndex = 0;
    protected shouldRecordStorage = false;
    protected meta?: ContractsMeta;
    protected prevBlocksInfo?: PrevBlocksInfo;
    protected randomSeed?: Buffer;
    protected shouldDebug = false;
    protected autoDeployLibs: boolean;
    protected transactions: BlockchainTransaction[] = [];

    protected defaultQueueManager: MessageQueueManager;

    protected collectCoverage: boolean = false;
    protected readonly coverageTransactions: BlockchainTransaction[][] = [];
    protected readonly coverageGetMethodResults: GetMethodResult[] = [];

    readonly executor: IExecutor;

    protected debuggerExecutor?: Executor;

    async getDebuggerExecutor() {
        if (!this.debuggerExecutor) {
            this.debuggerExecutor = await Executor.create({ debug: true });
        }
        return this.debuggerExecutor;
    }

    /**
     * Saves snapshot of current blockchain.
     * @example
     * const snapshot = blockchain.snapshot();
     * // some operations
     * await blockchain.loadFrom(snapshot); // restores blockchain state
     */
    snapshot(): BlockchainSnapshot {
        return {
            contracts: this.storage.knownContracts().map((s) => s.snapshot()),
            networkConfig: this.networkConfig,
            lt: this.currentLt,
            time: this.currentTime,
            verbosity: { ...this.logsVerbosity },
            libs: this.globalLibs,
            nextCreateWalletIndex: this.nextCreateWalletIndex,
            prevBlocksInfo: deepcopy(this.prevBlocksInfo),
            randomSeed: deepcopy(this.randomSeed),
            autoDeployLibs: this.autoDeployLibs,
            transactions: this.transactions.map((tx) => tx),
        };
    }

    /**
     * Restores blockchain state from snapshot.
     * Usage provided in {@link Blockchain#snapshot}.
     *
     * @param snapshot Snapshot of blockchain
     */
    async loadFrom(snapshot: BlockchainSnapshot) {
        this.storage.clearKnownContracts();
        this.contractFetches.clear();
        for (const contract of snapshot.contracts) {
            const storageContract = await this.getContract(contract.address);
            storageContract.loadFrom(contract);
        }

        this.networkConfig = snapshot.networkConfig;
        this.currentLt = snapshot.lt;
        this.currentTime = snapshot.time;
        this.logsVerbosity = { ...snapshot.verbosity };
        this.globalLibs = snapshot.libs;
        this.nextCreateWalletIndex = snapshot.nextCreateWalletIndex;
        this.prevBlocksInfo = deepcopy(snapshot.prevBlocksInfo);
        this.randomSeed = deepcopy(snapshot.randomSeed);
        this.autoDeployLibs = snapshot.autoDeployLibs;
        this.transactions = snapshot.transactions.map((tx) => tx);
    }

    get recordStorage() {
        return this.shouldRecordStorage;
    }

    /**
     * If set to `true`, [BlockchainTransaction]{@link BlockchainTransaction} will have `oldStorage` and `newStorage` fields.
     *
     * Note that enabling this flag will disable a certain optimization, which will slow down contract emulation
     *
     * @param v
     */
    set recordStorage(v: boolean) {
        this.shouldRecordStorage = v;
    }

    get autoDeployLibraries(): boolean {
        return this.autoDeployLibs;
    }

    set autoDeployLibraries(value: boolean) {
        this.autoDeployLibs = value;
    }

    get debug() {
        return this.shouldDebug;
    }

    set debug(value: boolean) {
        this.shouldDebug = value;
    }

    /**
     * @returns Current time in blockchain
     */
    get now() {
        return this.currentTime;
    }

    /**
     * Updates Current time in blockchain.
     * @param now UNIX time to set
     */
    set now(now: number | undefined) {
        this.currentTime = now;
    }

    /**
     * @returns Current logical time in blockchain
     */
    get lt() {
        return this.currentLt;
    }

    protected constructor(opts: {
        executor: IExecutor;
        config?: BlockchainConfig;
        storage: BlockchainStorage;
        meta?: ContractsMeta;
        autoDeployLibs?: boolean;
    }) {
        this.networkConfig = blockchainConfigToBase64(opts.config);
        this.executor = opts.executor;
        this.storage = opts.storage;
        this.meta = opts.meta;
        this.autoDeployLibs = opts.autoDeployLibs ?? false;

        this.defaultQueueManager = this.createQueueManager();
    }

    protected createQueueManager(): MessageQueueManager {
        return new MessageQueueManager(this.lock, {
            getContract: (address) => this.getContract(address),
            startFetchingContract: (address) => this.startFetchingContract(address),
            increaseLt: () => this.increaseLt(),
            getLibs: () => this.libs,
            setLibs: (value: Cell | undefined) => (this.libs = value),
            getAutoDeployLibs: () => this.autoDeployLibs,
            registerTxsForCoverage: (txs) => this.registerTxsForCoverage(txs),
            addTransaction: (transaction: BlockchainTransaction) => this.transactions.push(transaction),
        });
    }

    /**
     * @returns Config used in blockchain.
     */
    get config(): Cell {
        return Cell.fromBase64(this.networkConfig);
    }

    /**
     * @returns Config used in blockchain in base64 format.
     */
    get configBase64(): string {
        return this.networkConfig;
    }

    /**
     * @returns Current PrevBlocksInfo
     */
    get prevBlocks(): PrevBlocksInfo | undefined {
        return deepcopy(this.prevBlocksInfo);
    }

    /**
     * Sets PrevBlocksInfo.
     * @param value PrevBlocksInfo to set
     */
    set prevBlocks(value: PrevBlocksInfo | undefined) {
        this.prevBlocksInfo = deepcopy(value);
    }

    /**
     * @returns The current random seed
     */
    get random(): Buffer | undefined {
        return deepcopy(this.randomSeed);
    }

    /**
     * Sets the random seed
     * @param value A Buffer containing the new random seed
     */
    set random(value: Buffer | undefined) {
        this.randomSeed = deepcopy(value);
    }

    /**
     * Generates and sets a new random seed using secure random bytes.
     */
    async randomize(): Promise<Buffer> {
        this.randomSeed = await getSecureRandomBytes(32);
        return this.randomSeed;
    }

    /**
     * Emulates the result of sending a message to this Blockchain. Emulates the whole chain of transactions before returning the result. Each transaction increases lt by 1000000.
     *
     * @param message Message to send
     * @param params Optional params
     * @returns Result of queue processing
     *
     * @example
     * const result = await blockchain.sendMessage(internal({
     *      from: sender.address,
     *      to: address,
     *      value: toNano('1'),
     *      body: beginCell().storeUint(0, 32).endCell(),
     * }));
     */
    async sendMessage(message: Message | Cell, params?: MessageParams): Promise<SendMessageResult> {
        await this.defaultQueueManager.pushMessage(message);
        return await this.defaultQueueManager.runQueue(params);
    }

    /**
     * Starts emulating the result of sending a message to this Blockchain (refer to {@link sendMessage}). Each iterator call emulates one transaction, so the whole chain is not emulated immediately, unlike in {@link sendMessage}.
     *
     * @param message Message to send
     * @param params Optional params
     * @param params.allowParallel - When `true`, allows many consequential executions of this method. Useful for emulating interactions based on transaction order (MITM).
     *                        When `false` (default), only one execution of transactions is allowed.
     * @returns Async iterable of {@link BlockchainTransaction}
     *
     * @example
     * const message = internal({
     *     from: sender.address,
     *     to: address,
     *     value: toNano('1'),
     *     body: beginCell().storeUint(0, 32).endCell(),
     * });
     * for await (const tx of await blockchain.sendMessageIter(message, { randomSeed: crypto.randomBytes(32) })) {
     *     // process transaction
     * }
     */
    async sendMessageIter(
        message: Message | Cell,
        params?: SendMessageIterParams,
    ): Promise<AsyncIterator<BlockchainTransaction> & AsyncIterable<BlockchainTransaction>> {
        const queue = params?.allowParallel ? this.createQueueManager() : this.defaultQueueManager;
        await queue.pushMessage(message);
        // Iterable will lock on per tx basis
        return queue.runQueueIter(true, params);
    }

    /**
     * Runs tick or tock transaction.
     *
     * @param on Address or addresses to run tick-tock
     * @param which Type of transaction (tick or tock)
     * @param [params] Params to run tick tock transaction
     * @returns Result of tick-tock transaction
     *
     * @example
     * let res = await blockchain.runTickTock(address, 'tock');
     */
    async runTickTock(on: Address | Address[], which: TickOrTock, params?: MessageParams): Promise<SendMessageResult> {
        for (const addr of Array.isArray(on) ? on : [on]) {
            await this.defaultQueueManager.pushTickTock(addr, which);
        }
        return await this.defaultQueueManager.runQueue(params);
    }

    /**
     * Runs get method on contract.
     *
     * @param address Address or addresses to run get method
     * @param method MethodId or method name to run
     * @param stack Method params
     * @param [params] Params to run get method
     * @returns Result of get method
     *
     * @example
     * const { stackReader } = await blockchain.runGetMethod(address, 'get_now', [], {
     *     now: 2,
     * });
     * const now = res.stackReader.readNumber();
     */
    async runGetMethod(address: Address, method: number | string, stack: TupleItem[] = [], params?: GetMethodParams) {
        const result = await (await this.getContract(address)).get(method, stack, params);
        this.registerGetMethodForCoverage(result);
        return result;
    }

    /**
     * Retrieves transactions for the specified address. Transactions are ordered from newest to oldest.
     *
     * If both `lt` and `hash` are provided, the result will include transactions up to and including the one matching them.
     *
     * @param {Address} address - The address (sender or receiver) whose transactions are to be retrieved.
     * @param opts - Options to fetch transactions
     * @param [opts.lt] - Logical time of the transaction to start from. Must be used together with `hash`.
     * @param [opts.hash] - Hash of the transaction to start from. Must be used together with `lt`.
     * @param [opts.limit] - Maximum number of transactions to return.
     *
     * @returns {Promise<BlockchainTransaction[]>} Promise resolving to an array of transactions involving the given address.
     *
     * @throws {Error} If both `lt` and `hash` are provided but no matching transaction is found.
     *
     * @example
     * const transactions = await blockchain.getTransactions(Address.parse(...), {
     *   lt: '1234567890',
     *   hash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
     *   limit: 10
     * });
     */
    async getTransactions(
        address: Address,
        opts?: {
            limit?: number;
            lt?: string | bigint;
            hash?: string | Buffer;
        },
    ): Promise<BlockchainTransaction[]> {
        const transactionByAddress = this.transactions.reverse().filter((transaction) => {
            const dst = transaction.inMessage?.info?.dest;
            const src = transaction.inMessage?.info?.src;
            return (Address.isAddress(dst) && dst.equals(address)) || (Address.isAddress(src) && src.equals(address));
        });

        const { lt, hash, limit } = opts ?? {};

        let resultTransactions = transactionByAddress;

        if (lt !== undefined && hash !== undefined) {
            const hashBuffer = typeof hash === 'string' ? Buffer.from(hash, 'hex') : hash;
            const transaction = transactionByAddress.find((tx) => tx.lt === BigInt(lt) && tx.hash() === hashBuffer);
            if (!transaction) {
                throw new Error('Transaction with provided lt and hash not found.');
            }

            resultTransactions = resultTransactions.filter((tx) => tx.lt <= transaction.lt);
        }

        return resultTransactions.slice(0, limit);
    }

    protected increaseLt() {
        this.currentLt += LT_ALIGN;
    }

    /**
     * Creates new {@link ContractProvider} for contract address.
     *
     * @param address Address to create contract provider for
     * @param init Initial state of contract
     *
     * @example
     * const contractProvider = blockchain.provider(address, init);
     */
    provider(address: Address, init?: StateInit | null): ContractProvider {
        return new BlockchainContractProvider(
            {
                getTransactions: (address: Address, opts) => this.getTransactions(address, opts),
                getContract: (addr) => this.getContract(addr),
                pushMessage: (msg) => this.defaultQueueManager.pushMessage(msg),
                runGetMethod: (addr, method, args) => this.runGetMethod(addr, method, args),
                pushTickTock: (on, which) => this.defaultQueueManager.pushTickTock(on, which),
                openContract: <T extends Contract>(contract: T) => this.openContract(contract) as OpenedContract<T>,
            },
            address,
            init,
        );
    }

    /**
     * Creates {@link Sender} for address.
     *
     * Note, that this sender pushes internal messages to Blockchain directly.
     * No value is deducted from sender address, all the values are set to defaults. Use for test purposes only.
     *
     * @example
     * const sender = this.sender(address);
     * await contract.send(sender, ...);
     *
     * @param address Address to create sender for
     */
    sender(address: Address): Sender {
        return new BlockchainSender(
            {
                pushMessage: (msg) => this.defaultQueueManager.pushMessage(msg),
            },
            address,
        );
    }

    protected treasuryParamsToMapKey(workchain: number, seed: string) {
        return `${workchain}:${seed}`;
    }

    /**
     * Creates treasury wallet contract. This wallet is used as alternative to wallet smart contract.
     *
     * @param {string} seed Initial seed for treasury. If the same seed is used to create a treasury, then these treasuries will be identical
     * @param {TreasuryParams} params Params for treasury creation. See {@link TreasuryParams} for more information.
     *
     * @example
     * const wallet = await blockchain.treasury('wallet')
     * await wallet.send({
     *     to: someAddress,
     *     value: toNano('0.5'),
     * });
     */
    async treasury(seed: string, params?: TreasuryParams) {
        const subwalletId = testSubwalletId(seed);
        const wallet = this.openContract(TreasuryContract.create(params?.workchain ?? 0, subwalletId));

        const contract = await this.getContract(wallet.address);
        contract.setDebug(false);
        if (
            (params?.predeploy ?? true) &&
            (contract.accountState === undefined || contract.accountState.type === 'uninit')
        ) {
            await this.sendMessage(
                internal({
                    from: new Address(0, Buffer.alloc(32)),
                    to: wallet.address,
                    value: toNano(1),
                    stateInit: wallet.init,
                }),
            );
            contract.balance = params?.balance ?? toNano(TREASURY_INIT_BALANCE_TONS);
        } else if ((params?.resetBalanceIfZero ?? true) && contract.balance === 0n) {
            contract.balance = params?.balance ?? toNano(TREASURY_INIT_BALANCE_TONS);
        }

        this.meta?.upsert(wallet.address, { treasurySeed: seed });

        return wallet;
    }

    /**
     * Bulk variant of {@link treasury}.
     * @param n Number of wallets to create
     * @param params Params for treasury creation. See {@link TreasuryParams} for more information.
     * @returns Array of opened treasury contracts
     *
     * @example
     * const [wallet1, wallet2, wallet3] = await blockchain.createWallets(3);
     */
    async createWallets(n: number, params?: TreasuryParams) {
        const wallets: SandboxContract<TreasuryContract>[] = [];
        for (let i = 0; i < n; i++) {
            const seed = createWalletsSeed(this.nextCreateWalletIndex++);
            wallets.push(await this.treasury(seed, params));
        }
        return wallets;
    }

    /**
     * Opens contract. Returns proxy that substitutes the blockchain Provider in methods starting with get and set.
     *
     * @param contract Contract to open.
     *
     * @example
     * const contract = blockchain.openContract(new Contract(address));
     */
    openContract<T extends Contract>(contract: T) {
        let address: Address;
        let init: StateInit | undefined = undefined;

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

        this.meta?.upsert(address, { wrapperName: contract?.constructor?.name, abi: contract.abi });

        const provider = this.provider(address, init);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Proxy<any>(contract as any, {
            get: (target, prop) => {
                if (prop === SANDBOX_CONTRACT_SYMBOL) {
                    return true;
                }

                const value = target[prop];
                if (typeof prop === 'string' && typeof value === 'function') {
                    const ctx = {
                        contract,
                        methodName: prop,
                    };
                    if (prop.startsWith('get') || prop.startsWith('is')) {
                        return (...args: unknown[]) => value.apply(target, [provider, ...args]);
                    } else if (prop.startsWith('send')) {
                        return async (...args: unknown[]) => {
                            let ret = value.apply(target, [provider, ...args]);
                            if (ret instanceof Promise) {
                                ret = await ret;
                            }
                            const out = {
                                ...(await this.defaultQueueManager.runQueue()),
                                result: ret,
                            };
                            await collectMetric(this, ctx, out);
                            return out;
                        };
                    }
                }
                return value;
            },
        }) as SandboxContract<T>;
    }

    protected startFetchingContract(address: Address) {
        const addrString = address.toRawString();
        let promise = this.contractFetches.get(addrString);
        if (promise !== undefined) {
            return promise;
        }
        promise = this.storage.getContract(this, address);
        this.contractFetches.set(addrString, promise);
        return promise;
    }

    /**
     * Retrieves {@link SmartContract} from {@link BlockchainStorage}.
     * @param address Address of contract to get
     */
    async getContract(address: Address) {
        try {
            const contract = await this.startFetchingContract(address);
            return contract;
        } finally {
            this.contractFetches.delete(address.toRawString());
        }
    }

    /**
     * @returns {LogsVerbosity} level
     */
    get verbosity() {
        return this.logsVerbosity;
    }

    /**
     * Updates logs verbosity level.
     * @param {LogsVerbosity} value
     */
    set verbosity(value: LogsVerbosity) {
        this.logsVerbosity = value;
    }

    /**
     * Updates logs verbosity level for address.
     */
    async setVerbosityForAddress(address: Address, verbosity: Partial<LogsVerbosity> | Verbosity | undefined) {
        const contract = await this.getContract(address);
        contract.setVerbosity(verbosity);
    }

    /**
     * Updates blockchain config
     *
     * @param {BlockchainConfig} config - Custom config in Cell format, or predefined `default` | `slim`
     */
    setConfig(config: BlockchainConfig) {
        this.networkConfig = blockchainConfigToBase64(config);
    }

    async setShardAccount(address: Address, account: ShardAccount) {
        const contract = await this.getContract(address);
        contract.account = account;
    }

    /**
     * Retrieves global libs cell
     */
    get libs() {
        return this.globalLibs;
    }

    /**
     * Update global blockchain libs.
     *
     * @param value Cell in libs format: Dictionary<CellHash, Cell>
     *
     * @example
     * const code = await compile('Contract');
     *
     * const libsDict = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());
     * libsDict.set(code.hash(), code);
     *
     * blockchain.libs = beginCell().storeDictDirect(libsDict).endCell();
     */
    set libs(value: Cell | undefined) {
        this.globalLibs = value;
    }

    /**
     * Enable coverage collection.
     *
     * @param enable if false, disable coverage collection
     */
    public enableCoverage(enable: boolean = true) {
        this.collectCoverage = enable;
        this.verbosity.vmLogs = 'vm_logs_verbose';
    }

    /**
     * Returns coverage analysis for the specified contract.
     * Coverage is collected at the TVM assembly instruction level from all executed transactions and get method calls.
     *
     * @param contract Contract to analyze coverage for
     * @returns Coverage object with detailed coverage data
     * @throws Error if the contract has no code
     * @throws Error if verbose VM logs are not enabled (blockchain.verbosity.vmLogs !== "vm_logs_verbose")
     *
     * @example
     * // Enable coverage collection
     * blockchain.enableCoverage();
     *
     * // Execute contract methods
     * await contract.send(sender, { value: toNano('1') }, 'increment');
     *
     * // Get coverage analysis
     * const coverage = blockchain.coverage(contract);
     * const summary = coverage?.summary();
     * console.log(`Coverage: ${summary?.coveragePercentage?.toFixed(2)}%`);
     *
     * // Generate HTML report
     * const htmlReport = coverage?.report("html");
     * await fs.writeFile("coverage.html", htmlReport);
     */
    public coverage(contract: Contract): Coverage | undefined {
        const code = contract.init?.code;
        if (!code) {
            throw new Error('No code is available for contract');
        }

        const address = contract.address;
        return this.coverageForCell(code, address);
    }

    protected registerTxsForCoverage(txs: BlockchainTransaction[]) {
        if (!this.collectCoverage) return;
        this.coverageTransactions.push(txs);
    }

    protected registerGetMethodForCoverage(get: GetMethodResult) {
        if (!this.collectCoverage) return;
        this.coverageGetMethodResults.push(get);
    }

    /**
     * Returns coverage analysis for the specified code cell.
     * This method allows analyzing coverage for code cells directly, with optional address filtering.
     *
     * @param code Cell containing contract code to analyze
     * @param address Optional contract address to filter transactions by.
     *                If provided, only transactions from this address will be analyzed
     * @returns Coverage object with detailed coverage data
     * @throws Error if verbose VM logs are not enabled (blockchain.verbosity.vmLogs !== "vm_logs_verbose")
     *
     * @example
     * blockchain.enableCoverage();
     * // Analyze coverage for a specific code cell
     * const coverage = blockchain.coverageForCell(codeCell, contractAddress);
     *
     * // Analyze coverage for code without address filtering
     * const allCoverage = blockchain.coverageForCell(codeCell);
     *
     * console.log(coverage?.summary());
     */
    public coverageForCell(code: Cell, address?: Address): Coverage | undefined {
        if (!this.collectCoverage || this.verbosity.vmLogs !== 'vm_logs_verbose') {
            return undefined;
        }

        const txs = this.coverageTransactions.flatMap((tx) => collectTxsCoverage(code, address, tx));
        const gets = this.coverageGetMethodResults.flatMap((get) => collectAsmCoverage(code, get.vmLogs));

        const coverages = [...txs, ...gets];
        return new Coverage(mergeCoverages(...coverages));
    }

    /**
     * Creates instance of sandbox blockchain.
     *
     * @param [opts.executor] Custom contract executor. If omitted {@link Executor} is used.
     * @param [opts.config] Config used in blockchain. If omitted {@link defaultConfig} is used.
     * @param [opts.storage] Contracts storage used for blockchain. If omitted {@link LocalBlockchainStorage} is used.
     * @param [opts.meta] Optional contracts metadata provider. If not provided, {@link @ton/test-utils.contractsMeta} will be used to accumulate contracts metadata.
     * @param [opts.autoDeployLibs] Optional flag. If set to true, libraries will be collected automatically
     * @example
     * const blockchain = await Blockchain.create({ config: 'slim' });
     *
     * @example Remote storage
     * let client = new TonClient4({
     *     endpoint: 'https://mainnet-v4.tonhubapi.com'
     * })
     *
     * let blockchain = await Blockchain.create({
     *     storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(client), 34892000)
     * });
     */
    static async create(opts?: {
        executor?: IExecutor;
        config?: BlockchainConfig;
        storage?: BlockchainStorage;
        meta?: ContractsMeta;
        autoDeployLibs?: boolean;
    }) {
        return new Blockchain({
            executor: opts?.executor ?? (await Executor.create()),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            meta: opts?.meta ?? require('@ton/test-utils')?.contractsMeta,
            ...opts,
        });
    }
}
