import { WebSocket } from 'ws';
import { Address, beginCell } from '@ton/core';

import { ContractMeta } from '../meta/ContractsMeta';

export type ContractRawData = {
    readonly address: string;
    readonly meta: ContractMeta | undefined;
    readonly stateInit: string | undefined;
    readonly account: string | undefined;
};

export type MessageTestData = {
    readonly $: 'test-data';
    readonly testName: string | undefined;
    readonly transactions: string;
    readonly contracts: readonly ContractRawData[];
    readonly changes: ContractStateChange[];
};

export type Message = MessageTestData;

export function sendToWebsocket(ws: WebSocket | undefined, data: Message): void {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
    }

    if (ws === undefined) {
        console.warn('Cannot send, Websocket is undefined!');
    }
    if (ws && ws.readyState !== WebSocket.OPEN) {
        console.warn('Cannot send, Websocket is not open!');
    }
}

export type ContractStateChange = {
    readonly address: string | undefined;
    readonly lt: string;
    readonly before: string | undefined;
    readonly after: string | undefined;
};

export function bigintToAddress(addr: bigint | undefined): Address | undefined {
    if (addr === undefined) return undefined;

    try {
        const slice = beginCell().storeUint(4, 3).storeUint(0, 8).storeUint(addr, 256).asSlice();
        return slice.loadAddress();
    } catch {
        return undefined;
    }
}
