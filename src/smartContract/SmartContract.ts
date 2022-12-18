import BN from "bn.js";
import { Address, Cell, configParseGasLimitsPrices, ExternalMessage, GasLimitsPrices, InternalMessage, parseDict, parseDictRefs, parseStack, parseTransaction, RawTransaction, serializeDict, serializeStack, Slice, StackItem, TupleSlice4 } from "ton";
import { defaultConfig } from "../config/defaultConfig";
import { emulateTransaction, EmulationParams, runGetMethod } from "../emulator-exec/emulatorExec";
import { AccountState, AccountStorage, accountStorageToRaw, encodeShardAccount } from "../utils/encode";
import { parseShardAccount, RawAccount, RawShardAccount, RawShardAccountNullable } from "../utils/parse";
import { getSelectorForMethod } from "../utils/selector";
import { calcStorageUsed } from "../utils/storage";
import { parseC7 } from "./c7";
import { SmartContractError, SmartContractExternalNotAcceptedError } from "./errors";
import { serializeGasLimitsPrices } from "./gas";

export type SendMessageResult = {
    transaction: RawTransaction
    shardAccount: RawShardAccountNullable
    transactionCell: Cell
    shardAccountCell: Cell
    logs: string
    vmLogs: string
    debugLogs: string[]
    actionsCell?: Cell
    c7?: StackItem[]
};

export type Verbosity = 'short' | 'full' | 'full_location' | 'full_location_stack';

const verbosityToNum: Record<Verbosity, number> = {
    'short': 0,
    'full': 1,
    'full_location': 2,
    'full_location_stack': 3,
};

export type RunGetMethodParams = Partial<{
    unixTime: number
    randSeed: Buffer
    gasLimit: number | BN
}>;

export type RunGetMethodResult = {
    stack: StackItem[]
    stackSlice: TupleSlice4
    exitCode: number
    gasUsed: BN
    missingLibrary: Buffer | null
    logs: string
    vmLogs: string
    debugLogs: string[]
    c7: StackItem[]
};

export type Chain = 'masterchain' | 'workchain';

const chainGasLimitsPricesIds: Record<Chain, string> = {
    'masterchain': '20',
    'workchain': '21',
};

export class SmartContract {
    private configBoc: string = defaultConfig;
    private libsBoc?: string;
    private verbosity: Verbosity = 'full';
    private shardAccount: Cell;
    private rawShardAccount: RawShardAccountNullable;
    private address: Address;

    constructor(shardAccount: Cell, address?: Address) {
        this.rawShardAccount = parseShardAccount(shardAccount);
        const addr = address ?? this.rawShardAccount.account?.address;
        if (addr === undefined) {
            throw new Error('ShardAccount has `none` account and address was not given');
        }
        this.address = addr;
        if (this.rawShardAccount.account !== null && !this.address.equals(this.rawShardAccount.account.address)) {
            throw new Error('ShardAccount address and given address do not match');
        }
        this.shardAccount = shardAccount;
    }

    static fromState(state: {
        address: Address
        accountState: AccountState
        balance: BN
    }): SmartContract {
        const storage: AccountStorage = {
            lastTransLT: new BN(0),
            currencyCollection: {
                coins: state.balance,
            },
            accountState: state.accountState,
        };

        const storageRaw = accountStorageToRaw(storage)

        return new SmartContract(encodeShardAccount({
            account: {
                address: state.address,
                storageStat: {
                    used: calcStorageUsed(storageRaw),
                    lastPaid: 0,
                    duePayment: null,
                },
                storage: storageRaw,
            },
            lastTransHash: Buffer.alloc(32),
            lastTransLT: new BN(0),
        }));
    }

    static empty(address: Address) {
        return new SmartContract(encodeShardAccount({
            account: null,
            lastTransHash: Buffer.alloc(32),
            lastTransLT: new BN(0),
        }), address);
    }

    async sendMessage(message: ExternalMessage | InternalMessage, opts?: {
        mutateAccount?: boolean
        params?: EmulationParams
    }): Promise<SendMessageResult> {
        const msgCell = new Cell();
        message.writeTo(msgCell);
        const res = await emulateTransaction(this.configBoc, this.shardAccount, msgCell, {
            libs: this.libsBoc,
            verbosity: verbosityToNum[this.verbosity],
            params: opts?.params,
        });

        if (!res.result.success) {
            if (res.result.vmResults !== undefined) {
                throw new SmartContractExternalNotAcceptedError(res.result.error, res.logs, res.debugLogs, res.result.vmResults);
            }

            throw new SmartContractError(res.result.error, res.logs, res.debugLogs);
        }

        const shardAccountCell = Cell.fromBoc(Buffer.from(res.result.shardAccount, 'base64'))[0];
        const shardAccount = parseShardAccount(shardAccountCell);

        if (shardAccount.account !== null && !this.address.equals(shardAccount.account.address)) {
            throw new Error('new ShardAccount address and stored address do not match');
        }

        if (opts?.mutateAccount ?? true) {
            this.shardAccount = shardAccountCell;
            this.rawShardAccount = shardAccount;
        }

        const txCell = Cell.fromBoc(Buffer.from(res.result.transaction, 'base64'))[0];

        const tx = parseTransaction(
            this.getAddress().workChain,
            Slice.fromCell(txCell)
        );

        return {
            shardAccount,
            shardAccountCell,
            transaction: tx,
            transactionCell: txCell,
            logs: res.logs,
            vmLogs: res.result.vmLog,
            actionsCell: res.result.actions === null ? undefined : Cell.fromBoc(Buffer.from(res.result.actions, 'base64'))[0],
            debugLogs: res.debugLogs,
            c7: res.result.c7 === null ? undefined : parseC7(res.result.c7),
        };
    }

    async runGetMethod(method: string | number, stack: StackItem[] = [], params?: RunGetMethodParams): Promise<RunGetMethodResult> {
        const acc = this.getShardAccount();
        if (acc.account.storage.state.type !== 'active') {
            throw new Error('cannot run get methods on inactive accounts');
        }
        if (acc.account.storage.state.state.code === null || acc.account.storage.state.state.data === null) {
            throw new Error('cannot run get methods on accounts without code or data');
        }
        const res = await runGetMethod(
            acc.account.storage.state.state.code,
            acc.account.storage.state.state.data,
            typeof method === 'string' ? getSelectorForMethod(method) : method,
            serializeStack(stack),
            this.configBoc,
            {
                verbosity: verbosityToNum[this.verbosity],
                libs: this.libsBoc,
                address: acc.account.address,
                unixTime: params?.unixTime,
                balance: acc.account.storage.balance.coins,
                randSeed: params?.randSeed,
                gasLimit: params?.gasLimit,
            }
        );

        if (!res.result.success) {
            throw new SmartContractError(res.result.error, res.logs, res.debugLogs);
        }

        const retStack = parseStack(Cell.fromBoc(Buffer.from(res.result.stack, 'base64'))[0]);

        return {
            stack: retStack,
            stackSlice: new TupleSlice4(retStack),
            exitCode: res.result.vm_exit_code,
            gasUsed: new BN(res.result.gas_used, 10),
            c7: parseC7(res.result.c7),
            missingLibrary: res.result.missing_library === null ? null : Buffer.from(res.result.missing_library, 'hex'),
            logs: res.logs,
            vmLogs: res.result.vm_log,
            debugLogs: res.debugLogs,
        };
    }

    getAddress() {
        return this.address;
    }

    private checkAccount() {
        if (this.isAccountNull()) throw new Error('ShardAccount has `none` account');
    }

    getShardAccount(): RawShardAccount {
        this.checkAccount();
        return {
            ...this.rawShardAccount,
            account: this.rawShardAccount.account!,
        };
    }

    getShardAccountNullable() {
        return this.rawShardAccount;
    }

    getAccount(): RawAccount {
        this.checkAccount();
        return this.rawShardAccount.account!;
    }

    getAccountNullable(): RawAccount | null {
        return this.rawShardAccount.account;
    }

    isAccountNull() {
        return this.rawShardAccount.account === null;
    }

    private reencodeAccount() {
        this.shardAccount = encodeShardAccount(this.rawShardAccount);
    }

    getBalance() {
        return this.getAccount().storage.balance.coins;
    }

    setBalance(balance: BN) {
        this.checkAccount();
        this.rawShardAccount.account!.storage.balance.coins = balance;
        this.reencodeAccount();
    }

    getStorageLastPaid() {
        return this.getAccount().storageStat.lastPaid;
    }

    setStorageLastPaid(unixTime: number) {
        this.checkAccount();
        this.rawShardAccount.account!.storageStat.lastPaid = unixTime;
        this.reencodeAccount();
    }

    getConfig() {
        return Cell.fromBoc(Buffer.from(this.configBoc, 'base64'))[0]
    }

    setConfig(config: Cell) {
        this.configBoc = config.toBoc().toString('base64');
    }

    getConfigGasPrices(chain: Chain = 'workchain'): GasLimitsPrices {
        const c = this.getConfig()
        const d = parseDictRefs(c.beginParse(), 32)
        return configParseGasLimitsPrices(d.get(chainGasLimitsPricesIds[chain]));
    }

    setConfigGasPrices(gas: GasLimitsPrices, chain: Chain = 'workchain') {
        const c = this.getConfig()
        const d = parseDictRefs(c.beginParse(), 32)
        d.set(chainGasLimitsPricesIds[chain], serializeGasLimitsPrices(gas).beginParse());
        this.setConfig(serializeDict(d, 32, (src, cell) => cell.withReference(src.toCell())));
    }

    setLibs(libs?: Cell) {
        this.libsBoc = libs === undefined ? undefined : libs.toBoc().toString('base64');
    }

    setVerbosity(verbosity: Verbosity) {
        this.verbosity = verbosity;
    }
}