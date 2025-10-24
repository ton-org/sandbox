import WebSocket from 'ws';
import { Address, beginCell, storeShardAccount, storeStateInit, storeTransaction, Transaction } from '@ton/core';

import { BlockchainTransaction } from '../blockchain/Blockchain';
import {
    HexString,
    RawContractData,
    RawTransactionInfo,
    RawTransactionsInfo,
    websocketSend,
} from './transport-websocket';
import { ContractMeta } from '../meta/ContractsMeta';
import { SmartContract } from '../blockchain/SmartContract';

// eslint-disable-next-line no-undef
declare const expect: jest.Expect;

export interface IWebSocketManager {
    publishTransactions(transactions: BlockchainTransaction[]): Promise<void>;
}

export type ConnectionOptions = { port?: number; host?: string };

export class WebSocketManager implements IWebSocketManager {
    protected ws: WebSocket | undefined = undefined;

    constructor(
        private readonly connectionOptions: ConnectionOptions = { port: 7743, host: 'localhost' },
        private readonly blockchain: {
            getMeta(address: Address): ContractMeta | undefined;
            knownContracts(): SmartContract[];
        },
    ) {}

    async publishTransactions(txs: BlockchainTransaction[]) {
        const testName = expect === undefined ? '' : expect.getState().currentTestName;
        const transactions = this.serializeTransactions(txs);
        const contracts = this.contractsData();

        // This solution, requiring a reconnection for each sending, may seem inefficient.
        // An alternative would be to establish a single connection when creating the Blockchain,
        // but in that case, it's unclear when this connection should be closed.
        // Until the connection is closed, the Node process will not terminate, and Jest will issue
        // a warning, but the test will continue to wait for the connection to be closed.
        //
        // This solution does not have this problem since the connection is closed immediately after sending.
        // The reconnection time, meanwhile, is short enough to not be noticeable during tests.
        await this.websocketConnect();
        websocketSend(this.ws, { type: 'test-data', testName, transactions, contracts });
        this.websocketDisconnect();
    }

    /**
     * Convert the `BlockchainTransaction` array to `RawTransactionsInfo` that can be safely sent over network.
     * @param transactions Input transactions to serialize
     */
    protected serializeTransactions(transactions: BlockchainTransaction[]): RawTransactionsInfo {
        return {
            transactions: transactions.map((t): RawTransactionInfo => {
                const tx = beginCell()
                    .store(storeTransaction(t as Transaction))
                    .endCell()
                    .toBoc()
                    .toString('hex');

                return {
                    transaction: tx,
                    blockchainLogs: t.blockchainLogs,
                    vmLogs: t.vmLogs,
                    debugLogs: t.debugLogs,
                    code: undefined,
                    sourceMap: undefined,
                    contractName: undefined,
                    parentId: t.parent?.lt.toString(),
                    childrenIds: t.children?.map((c) => c?.lt?.toString()),
                    oldStorage: t.oldStorage?.toBoc().toString('hex') as HexString | undefined,
                    newStorage: t.newStorage?.toBoc().toString('hex') as HexString | undefined,
                    callStack: t.callStack,
                };
            }),
        };
    }

    protected async websocketConnect(): Promise<void> {
        await this.websocketConnectOrThrow().catch(() => {
            // eslint-disable-next-line no-console
            console.warn(
                'Unable to connect to websocket server. Make sure the port and host match the sandbox server or VS Code settings. You can set the WebSocket address globally with `SANDBOX_WEBSOCKET_ADDR=ws://localhost:7743` or via `Blockchain.create({ connectionOptions: { host: "localhost", port: 7743 } })`.',
            );
        });
    }

    private contractsData(): RawContractData[] {
        return this.blockchain.knownContracts().map((contract): RawContractData => {
            const state = contract.accountState;
            const stateInit = beginCell();
            if (state?.type === 'active') {
                stateInit.store(storeStateInit(state.state));
            }
            const stateInitCell = stateInit.asCell();

            const account = contract.account;
            const accountCell = beginCell().store(storeShardAccount(account)).endCell();

            return {
                address: contract.address.toString(),
                meta: this.blockchain.getMeta(contract.address),
                stateInit:
                    stateInitCell.bits.length === 0 ? undefined : (stateInitCell.toBoc().toString('hex') as HexString),
                account: accountCell.toBoc().toString('hex') as HexString,
            };
        });
    }

    protected async websocketConnectOrThrow(): Promise<void> {
        if (this.ws !== undefined) return;
        return new Promise((resolve, reject) => {
            const addr =
                process.env.SANDBOX_WEBSOCKET_ADDR ??
                `ws://${this.connectionOptions.host ?? 'localhost'}:${this.connectionOptions.port ?? '7743'}`;
            this.ws = new WebSocket(addr);

            this.ws.on('open', () => {
                resolve();
            });

            this.ws.on('error', (error) => {
                reject(error);
            });
        });
    }

    protected websocketDisconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = undefined;
        }
    }
}
