import { Transaction } from '@ton/core';

export function extractTransaction(transactionLike: Transaction & Record<string, unknown>): Transaction {
    return {
        address: transactionLike.address,
        lt: transactionLike.lt,
        prevTransactionHash: transactionLike.prevTransactionHash,
        prevTransactionLt: transactionLike.prevTransactionLt,
        now: transactionLike.now,
        outMessagesCount: transactionLike.outMessagesCount,
        oldStatus: transactionLike.oldStatus,
        endStatus: transactionLike.endStatus,
        inMessage: transactionLike.inMessage,
        outMessages: transactionLike.outMessages,
        totalFees: transactionLike.totalFees,
        stateUpdate: transactionLike.stateUpdate,
        description: transactionLike.description,
        raw: transactionLike.raw,
        hash: transactionLike.hash,
    };
}
