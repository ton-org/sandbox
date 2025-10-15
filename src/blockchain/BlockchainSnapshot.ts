import {
    Address,
    beginCell,
    Cell,
    storeShardAccount,
    storeTransaction,
    Builder,
    storeMessageRelaxed,
    loadShardAccount,
    loadTransaction,
    loadMessageRelaxed,
} from '@ton/core';

import { loadOutListExt, LogsVerbosity, SmartContractSnapshot, storeOutListExt } from './SmartContract';
import { BlockId, PrevBlocksInfo } from '../executor/Executor';
import { BlockchainTransaction, ExternalOut } from './Blockchain';
import { extractEvents } from '../event/Event';

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

export type SerializableBlockId = {
    workchain: number;
    shard: string;
    seqno: number;
    rootHash: string;
    fileHash: string;
};

export function blockIdToSerializable(blockId: BlockId): SerializableBlockId {
    return {
        workchain: blockId.workchain,
        shard: blockId.shard.toString(),
        seqno: blockId.seqno,
        rootHash: blockId.rootHash.toString('hex'),
        fileHash: blockId.fileHash.toString('hex'),
    };
}

export type SerializableSnapshot = {
    contracts: {
        address: string;
        account: string;
        lastTxTime: number;
        verbosity?: Partial<LogsVerbosity>;
    }[];
    networkConfig: string;
    lt: string;
    time?: number;
    verbosity: LogsVerbosity;
    libs?: string;
    nextCreateWalletIndex: number;
    prevBlocksInfo?: {
        lastMcBlocks: SerializableBlockId[];
        prevKeyBlock: SerializableBlockId;
        lastMcBlocks100?: SerializableBlockId[];
    };
    randomSeed?: string;
    autoDeployLibs: boolean;
    transactions: {
        transaction: string;
        blockchainLogs: string;
        vmLogs: string;
        debugLogs: string;
        oldStorage?: string;
        newStorage?: string;
        outActions?: string;
        externals: string[];
        mode?: number;
        parentHash?: string;
        childrenHashes: string[];
    }[];
};

function writableToBase64(writer: (builder: Builder) => void): string {
    return beginCell().store(writer).endCell().toBoc().toString('base64');
}

export function snapshotToSerializable(snapshot: BlockchainSnapshot): SerializableSnapshot {
    return {
        contracts: snapshot.contracts.map((contract) => ({
            account: writableToBase64(storeShardAccount(contract.account)),
            address: contract.address.toString(),
            lastTxTime: contract.lastTxTime,
            verbosity: contract.verbosity,
        })),
        networkConfig: snapshot.networkConfig,
        lt: snapshot.lt.toString(),
        time: snapshot.time,
        verbosity: snapshot.verbosity,
        libs: snapshot.libs?.toBoc().toString('base64'),
        nextCreateWalletIndex: snapshot.nextCreateWalletIndex,
        prevBlocksInfo: snapshot.prevBlocksInfo
            ? {
                  lastMcBlocks: snapshot.prevBlocksInfo.lastMcBlocks.map(blockIdToSerializable),
                  prevKeyBlock: blockIdToSerializable(snapshot.prevBlocksInfo.prevKeyBlock),
                  lastMcBlocks100: snapshot.prevBlocksInfo.lastMcBlocks100?.map(blockIdToSerializable),
              }
            : undefined,
        randomSeed: snapshot.randomSeed?.toString('hex'),
        autoDeployLibs: snapshot.autoDeployLibs,
        transactions: snapshot.transactions.map((transaction) => {
            return {
                transaction: writableToBase64(storeTransaction(transaction)),
                blockchainLogs: transaction.blockchainLogs,
                vmLogs: transaction.vmLogs,
                debugLogs: transaction.debugLogs,
                oldStorage: transaction.oldStorage?.toBoc().toString('base64'),
                newStorage: transaction.newStorage?.toBoc().toString('base64'),
                outActions: transaction.outActions
                    ? writableToBase64(storeOutListExt(transaction.outActions))
                    : undefined,
                externals: transaction.externals.map((external) => writableToBase64(storeMessageRelaxed(external))),
                mode: transaction.mode,
                parentHash: transaction.parent?.hash().toString('hex'),
                childrenHashes: transaction.children.map((tx) => tx.hash().toString('hex')),
            };
        }),
    };
}

function blockIdFromSerializable(s: SerializableBlockId): BlockId {
    return {
        workchain: s.workchain,
        shard: BigInt(s.shard),
        seqno: s.seqno,
        rootHash: Buffer.from(s.rootHash, 'hex'),
        fileHash: Buffer.from(s.fileHash, 'hex'),
    };
}

export function snapshotFromSerializable(serialized: SerializableSnapshot): BlockchainSnapshot {
    const transactions = serialized.transactions.map((t): BlockchainTransaction => {
        const transaction = loadTransaction(Cell.fromBase64(t.transaction).beginParse());
        return {
            ...transaction,
            blockchainLogs: t.blockchainLogs,
            vmLogs: t.vmLogs,
            debugLogs: t.debugLogs,
            oldStorage: t.oldStorage ? Cell.fromBase64(t.oldStorage) : undefined,
            newStorage: t.newStorage ? Cell.fromBase64(t.newStorage) : undefined,
            outActions: t.outActions ? loadOutListExt(Cell.fromBase64(t.outActions).beginParse()) : undefined,
            events: extractEvents(transaction),
            mode: t.mode,
            externals: t.externals.map((ext) => loadMessageRelaxed(Cell.fromBase64(ext).beginParse())) as ExternalOut[],
            children: [],
        };
    });
    const transactionsMap = new Map(transactions.map((tx) => [tx.hash().toString('hex'), tx]));

    for (let i = 0; i < transactions.length; i++) {
        const { parentHash, childrenHashes } = serialized.transactions[i];
        transactions[i].parent = parentHash ? transactionsMap.get(parentHash) : undefined;
        transactions[i].children = childrenHashes.map((hash) => transactionsMap.get(hash)!);
    }

    return {
        contracts: serialized.contracts.map(
            (contract): SmartContractSnapshot => ({
                address: Address.parse(contract.address),
                account: loadShardAccount(Cell.fromBase64(contract.account).beginParse()),
                lastTxTime: contract.lastTxTime,
                verbosity: contract.verbosity,
            }),
        ),
        networkConfig: serialized.networkConfig,
        lt: BigInt(serialized.lt),
        time: serialized.time,
        verbosity: serialized.verbosity,
        libs: serialized.libs ? Cell.fromBase64(serialized.libs) : undefined,
        nextCreateWalletIndex: serialized.nextCreateWalletIndex,
        prevBlocksInfo: serialized.prevBlocksInfo
            ? {
                  lastMcBlocks: serialized.prevBlocksInfo.lastMcBlocks.map(blockIdFromSerializable),
                  prevKeyBlock: blockIdFromSerializable(serialized.prevBlocksInfo.prevKeyBlock),
                  lastMcBlocks100: serialized.prevBlocksInfo.lastMcBlocks100?.map(blockIdFromSerializable),
              }
            : undefined,
        randomSeed: serialized.randomSeed ? Buffer.from(serialized.randomSeed, 'hex') : undefined,
        autoDeployLibs: serialized.autoDeployLibs,
        transactions,
    };
}
