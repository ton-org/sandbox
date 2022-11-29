import BN from "bn.js";
import { Address, AddressExternal, Cell, CellMessage, CommonMessageInfo, ExternalMessage, InternalMessage, RawMessage, StateInit } from "ton";
import { EmulationParams } from "../emulator-exec/emulatorExec";
import { SendMessageResult, SmartContract } from "../smartContract/SmartContract";
import { RawShardAccount } from "../utils/parse";

export type ExternalOut = {
    from: Address;
    to: AddressExternal | null;
    createdLt: BN;
    createdAt: number;
    body: Cell;
};

export type TransactionOutput = {
    result: SendMessageResult;
    outTransactions: Transaction[];
    outExternals: ExternalOut[];
};

type TransactionOutputInternal = {
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

export class Blockchain {
    private contracts: Map<string, SmartContract>;

    constructor() {
        this.contracts = new Map();
    }

    private addressToString(addr: Address): string {
        return addr.toString();
    }

    private async processMessage(msg: ExternalMessage | InternalMessage, opts?: {
        mutateAccounts?: boolean
        params?: EmulationParams
    }): Promise<TransactionOutputInternal> {
        const addrString = this.addressToString(msg.to);
        let contract = this.contracts.get(addrString);
        if (contract === undefined) {
            contract = SmartContract.fromState({
                address: msg.to,
                accountState: {
                    type: 'uninit'
                },
                balance: new BN(0),
            });
            this.setSmartContract(contract);
        }
        const res = await contract.sendMessage(msg, opts);
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
            result: res,
            outMessages: msgs,
            outExternals: exts,
        };
    }

    async sendMessage(message: ExternalMessage | InternalMessage, opts?: {
        mutateAccounts?: boolean
        params?: EmulationParams
    }): Promise<RootTransaction> {
        const rootOut = await this.processMessage(message, opts);
        const rootTx: RootTransaction = {
            input: message,
            result: rootOut.result,
            outExternals: rootOut.outExternals,
            outTransactions: [],
        };
        const queue: QueueElement[] = rootOut.outMessages.map(m => ({
            input: m,
            parentTransaction: rootTx,
        }));
        while (queue.length > 0) {
            const el = queue.shift()!;
            const out = await this.processMessage(el.input, opts);
            const tx: Transaction = {
                input: el.input,
                result: out.result,
                outExternals: out.outExternals,
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

    getShardAccount(address: Address): RawShardAccount | undefined {
        return this.contracts.get(this.addressToString(address))?.getShardAccount();
    }

    setSmartContract(contract: SmartContract) {
        this.contracts.set(this.addressToString(contract.getAddress()), contract);
    }
}