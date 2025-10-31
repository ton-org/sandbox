import { WebSocket } from 'ws';

import { ContractMeta } from '../meta/ContractsMeta';

declare const hexBrand: unique symbol;
export type HexString = string & { readonly [hexBrand]: true };

export interface RawContractData {
    /**
     * User-friendly representation of the contract address.
     */
    readonly address: string;
    /**
     * Additional information about the contract.
     */
    readonly meta: ContractMeta | undefined;
    /**
     * Hex-encoded state init of the contract.
     */
    readonly stateInit: HexString | undefined;
    /**
     * Hex-encoded shard account info of the contract.
     */
    readonly account: HexString | undefined;
}

export interface MessageTestData {
    readonly type: 'test-data';
    /**
     * Name of the current running test or undefined.
     */
    readonly testName: string | undefined;
    /**
     * All transactions in the chain.
     */
    readonly transactions: RawTransactionsInfo;
    /**
     * Known contracts information.
     */
    readonly contracts: readonly RawContractData[];
}

export interface RawTransactionsInfo {
    readonly transactions: readonly RawTransactionInfo[];
}

export interface RawTransactionInfo {
    readonly transaction: string;
    readonly blockchainLogs: string;
    readonly vmLogs: string;
    readonly debugLogs: string;
    readonly code: string | undefined;
    readonly sourceMap: object | undefined;
    readonly contractName: string | undefined;
    readonly parentId: string | undefined;
    readonly childrenIds: string[];
    readonly oldStorage: HexString | undefined;
    readonly newStorage: HexString | undefined;
    readonly callStack: string | undefined;
}

export type Message = MessageTestData;

export function websocketSend(ws: WebSocket | undefined, data: Message): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }

    if (ws === undefined) {
        // eslint-disable-next-line no-console
        console.warn('Cannot send, Websocket is undefined!');
    }
    if (ws && ws.readyState !== WebSocket.OPEN) {
        // eslint-disable-next-line no-console
        console.warn('Cannot send, Websocket is not open!');
    }
}
