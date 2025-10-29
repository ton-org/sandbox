import { beginCell, storeShardAccount, storeStateInit, storeTransaction, Transaction } from '@ton/core';

import { BlockchainTransaction } from '../blockchain/Blockchain';
import { ContractMeta } from '../meta/ContractsMeta';
import { SmartContract } from '../blockchain/SmartContract';

declare const hexBrand: unique symbol;
export type HexString = string & { readonly [hexBrand]: true };

export type MessageTestData = {
    readonly type: 'test-data';
    readonly testInfo: TestInfo | undefined;
    readonly transactions: RawTransactionsInfo;
    readonly contracts: readonly RawContractData[];
};

export type Message = MessageTestData;

export type RawTransactionsInfo = {
    readonly transactions: readonly RawTransactionInfo[];
};

export type RawTransactionInfo = {
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
};

export function serializeTransactions(transactions: BlockchainTransaction[]): RawTransactionsInfo {
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

export type RawContractData = {
    readonly address: string;
    readonly meta: ContractMeta | undefined;
    readonly stateInit: HexString | undefined;
    readonly account: HexString | undefined;
};

export function serializeContracts(contracts: { contract: SmartContract; meta?: ContractMeta }[]): RawContractData[] {
    return contracts.map(({ contract, meta }): RawContractData => {
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
            meta,
            stateInit:
                stateInitCell.bits.length === 0 ? undefined : (stateInitCell.toBoc().toString('hex') as HexString),
            account: accountCell.toBoc().toString('hex') as HexString,
        };
    });
}

export type TestInfo = {
    readonly id?: string;
    readonly name?: string;
    readonly path?: string;
};
