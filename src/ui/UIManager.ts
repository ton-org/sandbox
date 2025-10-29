import { Address } from '@ton/core';

import { BlockchainTransaction } from '../blockchain/Blockchain';
import { ContractMeta } from '../meta/ContractsMeta';
import { SmartContract } from '../blockchain/SmartContract';
import { serializeTransactions, serializeContracts, TestInfo, MessageTestData } from './protocol';
import { IUIConnector } from './connection/UIConnector';

// eslint-disable-next-line no-undef
declare const expect: jest.Expect | undefined;

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
        let testInfo = this.getTestInfo();
        const transactions = serializeTransactions(txs);
        const knownContracts = this.blockchain.knownContracts();
        const contracts = serializeContracts(
            knownContracts.map((contract) => ({ contract, meta: this.blockchain.getMeta(contract.address) })),
        );

        this.connector.send(
            JSON.stringify({ type: 'test-data', testInfo, transactions, contracts } satisfies MessageTestData),
        );
    }

    private getTestInfo(): TestInfo | undefined {
        if (expect === undefined) {
            return;
        }

        const expectState = expect.getState();

        return {
            id: expectState.testId,
            name: expectState.currentTestName,
            path: expectState.testPath,
        };
    }
}
