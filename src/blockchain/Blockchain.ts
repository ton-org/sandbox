import BN from "bn.js";
import { defaultConfig } from "../config/defaultConfig";
import { Address, AddressExternal, Cell, CellMessage, CommonMessageInfo, configParseGasLimitsPrices, contractAddress, ExternalMessage, GasLimitsPrices, InternalMessage, parseDictRefs, RawMessage, serializeDict, StackItem, StateInit } from "ton";
import { EmulationParams } from "../emulator-exec/emulatorExec";
import { RunGetMethodParams, RunGetMethodResult, SendMessageResult, SmartContract, Verbosity } from "../smartContract/SmartContract";
import { serializeGasLimitsPrices } from "../smartContract/gas";
import { AccountState } from "../utils/encode";

export type ExternalOut = {
    from: Address;
    to: AddressExternal | null;
    createdLt: BN;
    createdAt: number;
    body: Cell;
};

export type TransactionOutput = {
    smartContract: Address;
    result: SendMessageResult;
    outMessages: InternalMessage[];
    outTransactions: Transaction[];
    outExternals: ExternalOut[];
};

type TransactionOutputInternal = {
    smartContract: Address;
    result: SendMessageResult;
    outMessages: InternalMessage[];
    outExternals: ExternalOut[];
};

export type Transaction = {
    input: InternalMessage;
} & TransactionOutput;

export type RootTransaction = {
    input: InternalMessage | ExternalMessage;
} & TransactionOutput;

type QueueElement = {
    input: InternalMessage;
    parentTransaction: TransactionOutput;
};

const rawMessageToInternalMessage = (msg: RawMessage): InternalMessage => {
    if (msg.info.type !== 'internal') throw new Error('Unexpected message type ' + msg.info.type);

    return new InternalMessage({
        from: msg.info.src,
        to: msg.info.dest,
        value: msg.info.value.coins,
        ihrDisabled: msg.info.ihrDisabled,
        bounce: msg.info.bounce,
        bounced: msg.info.bounced,
        ihrFees: msg.info.ihrFee,
        fwdFees: msg.info.fwdFee,
        createdAt: msg.info.createdAt,
        createdLt: msg.info.createdLt,
        body: new CommonMessageInfo({
            body: new CellMessage(msg.body),
            stateInit: msg.init === null ? null : new StateInit({
                code: msg.init.code,
                data: msg.init.data,
            }),
        }),
    });
};

const rawMessageToExternalOut = (msg: RawMessage): ExternalOut => {
    if (msg.info.type !== 'external-out') throw new Error('Unexpected message type ' + msg.info.type);

    return {
        from: msg.info.src,
        to: msg.info.dest,
        createdAt: msg.info.createdAt,
        createdLt: msg.info.createdLt,
        body: msg.body,
    };
};

export type Chain = 'masterchain' | 'workchain';

const chainGasLimitsPricesIds: Record<Chain, string> = {
    'masterchain': '20',
    'workchain': '21',
};

export type SendMessageOpts = {
    mutateAccounts?: boolean
    params?: EmulationParams
    processOutMessages?: boolean
};

const LT_ALIGN = new BN(1000000);

export class Blockchain {
    private contracts: Map<string, SmartContract>
    private networkConfig: Cell
    private libsBoc?: string;
    private lt = new BN(0);

    private constructor(opts?: { config?: Cell }) {
        this.networkConfig = opts?.config ?? Cell.fromBoc(Buffer.from(defaultConfig, 'base64'))[0]
        this.contracts = new Map();
    }

    get config(): Cell {
        return this.config
    }

    private async processMessage(msg: ExternalMessage | InternalMessage, opts?: {
        mutateAccounts?: boolean
        params?: EmulationParams
    }): Promise<TransactionOutputInternal> {
        const contract = this.getSmartContract(msg.to);
        const res = await contract.sendMessage(msg, this.configBoc, this.libsBoc, {
            mutateAccount: opts?.mutateAccounts,
            params: opts?.params,
        });
        const msgs: InternalMessage[] = [];
        const exts: ExternalOut[] = [];
        for (const outMsg of res.transaction.outMessages) {
            switch (outMsg.info.type) {
                case 'internal':
                    msgs.push(rawMessageToInternalMessage(outMsg));
                    break;
                case 'external-out':
                    exts.push(rawMessageToExternalOut(outMsg));
                    break;
                default:
                    throw new Error('Unexpected message type ' + outMsg.info.type);
            }
        }

        return {
            smartContract: contract.getAddress(),
            result: res,
            outMessages: msgs,
            outExternals: exts,
        };
    }

    async sendMessage(message: ExternalMessage | InternalMessage, opts?: SendMessageOpts): Promise<RootTransaction> {
        if (opts?.params?.lt === undefined) {
            this.lt.iadd(LT_ALIGN);
            opts = {
                ...opts,
                params: {
                    ...opts?.params,
                    lt: this.lt,
                },
            };
        }
        const rootOut = await this.processMessage(message, opts);
        const rootTx: RootTransaction = {
            input: message,
            smartContract: rootOut.smartContract,
            result: rootOut.result,
            outExternals: rootOut.outExternals,
            outMessages: rootOut.outMessages,
            outTransactions: [],
        };
        if (!(opts?.processOutMessages ?? true)) return rootTx;
        const queue: QueueElement[] = rootOut.outMessages.map(m => ({
            input: m,
            parentTransaction: rootTx,
        }));
        while (queue.length > 0) {
            const el = queue.shift()!;
            const out = await this.processMessage(el.input, opts);
            const tx: Transaction = {
                input: el.input,
                smartContract: out.smartContract,
                result: out.result,
                outExternals: out.outExternals,
                outMessages: out.outMessages,
                outTransactions: [],
            };
            el.parentTransaction.outTransactions.push(tx);
            queue.push(...out.outMessages.map(m => ({
                input: m,
                parentTransaction: tx,
            })));
        }
        return rootTx;
    }

    async runGetMethod(address: Address, method: string | number, stack: StackItem[] = [], params?: RunGetMethodParams): Promise<RunGetMethodResult> {
        return await this.getSmartContract(address).runGetMethod(method, stack, this.configBoc, this.libsBoc, params);
    }

    async initSmartContract(params: {
        address?: Address
        workchain?: number
        code?: Cell
        data?: Cell
        value: BN
        body?: Cell
        bounce?: boolean
        bounced?: boolean
        from?: Address
    }, opts?: SendMessageOpts) {
        const code = params.code ?? new Cell();
        const data = params.data ?? new Cell();
        let address = params.address;
        if (address === undefined) {
            if (params.workchain === undefined) throw new Error('workchain must be specified if address is not specified');
            address = contractAddress({
                workchain: params.workchain,
                initialCode: code,
                initialData: data,
            });
        }
        const msg = new InternalMessage({
            to: address,
            from: params.from,
            value: params.value,
            bounce: params.bounce ?? true,
            bounced: params.bounced,
            body: new CommonMessageInfo({
                stateInit: new StateInit({
                    code,
                    data,
                }),
                body: new CellMessage(params.body ?? new Cell()),
            }),
        });
        return await this.sendMessage(msg, opts);
    }

    setSmartContractState(address: Address, accountState: AccountState, balance = new BN(0)) {
        this.setSmartContract(SmartContract.fromState({
            address,
            accountState,
            balance,
        }));
    }

    setSmartContractShardAccount(shardAccount: Cell, address?: Address) {
        this.setSmartContract(new SmartContract(shardAccount, address));
    }

    deleteSmartContract(address: Address) {
        this.contracts.delete(this.addressToString(address));
    }

    private getSmartContract(address: Address) {
        const key = this.addressToString(address);
        let smc = this.contracts.get(key);
        if (smc === undefined) {
            smc = SmartContract.empty(address);
            this.setSmartContract(smc);
        }
        return smc;
    }

    private setSmartContract(contract: SmartContract) {
        this.contracts.set(this.addressToString(contract.getAddress()), contract);
    }

    setConfig(config: Cell) {
        this.networkConfig = config
    }

    setLibs(libs?: Cell) {
        this.libsBoc = libs === undefined ? undefined : libs.toBoc().toString('base64');
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

    getShardAccount(address: Address) {
        return this.getSmartContract(address).getShardAccount();
    }

    getShardAccountNullable(address: Address) {
        return this.getSmartContract(address).getShardAccountNullable();
    }

    getAccount(address: Address) {
        return this.getSmartContract(address).getAccount();
    }

    getAccountNullable(address: Address) {
        return this.getSmartContract(address).getAccountNullable();
    }

    isAccountNull(address: Address) {
        return this.getSmartContract(address).isAccountNull();
    }

    getBalance(address: Address) {
        return this.getSmartContract(address).getBalance();
    }

    setBalance(address: Address, balance: BN) {
        this.getSmartContract(address).setBalance(balance);
    }

    getStorageLastPaid(address: Address) {
        return this.getSmartContract(address).getStorageLastPaid();
    }

    setStorageLastPaid(address: Address, unixTime: number) {
        this.getSmartContract(address).setStorageLastPaid(unixTime);
    }

    setVerbosity(address: Address, verbosity: Verbosity) {
        this.getSmartContract(address).setVerbosity(verbosity);
    }

    getLastBlockLt() {
        return this.lt.clone();
    }

    setLastBlockLt(lt: BN) {
        this.lt = lt.clone();
    }

    static create(opts?: { config?: Cell }) {
        return new Blockchain(opts)
    }
}