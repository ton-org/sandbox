import { Address } from '@ton/core';

import { BlockchainTransaction } from '../blockchain/Blockchain';
import { ContractMeta } from '../meta/ContractsMeta';
import { SmartContract } from '../blockchain/SmartContract';
import { serializeTransactions, serializeContracts } from './protocol';
import { IUIConnector } from './connection/UIConnector';

// eslint-disable-next-line no-undef
declare const expect: jest.Expect;

export interface IUIManager {
    publishTransactions(transactions: BlockchainTransaction[]): void;
}

export class UIManager implements IUIManager {
    constructor(
        private readonly connector: IUIConnector,
        private readonly blockchain: {
            getMeta(address: Address): ContractMeta | undefined;
            knownContracts(): SmartContract[];
        },
    ) {}

    publishTransactions(txs: BlockchainTransaction[]) {
        const testName = expect === undefined ? '' : expect.getState().currentTestName;
        const transactions = serializeTransactions(txs);
        const knownContracts = this.blockchain.knownContracts();
        const contracts = serializeContracts(
            knownContracts.map((contract) => ({ contract, meta: this.blockchain.getMeta(contract.address) })),
        );

        this.connector.send(JSON.stringify({ type: 'test-data', testName, transactions, contracts }));
    }
}
