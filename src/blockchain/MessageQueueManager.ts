import {
    Address,
    beginCell,
    Cell,
    Dictionary,
    loadMessage,
    Message,
    OutActionChangeLibrary,
    OutActionSendMsg,
} from '@ton/core';

import { BlockchainTransaction, PendingMessage, SendMessageResult } from './Blockchain';
import { AsyncLock } from '../utils/AsyncLock';
import { TickOrTock } from '../executor/Executor';
import { MessageParams, OutActionExtended, SmartContract, SmartContractTransaction } from './SmartContract';
import { extractEvents } from '../event/Event';

export class MessageQueueManager {
    private messageQueue: PendingMessage[] = [];

    constructor(
        private readonly lock: AsyncLock,
        private readonly blockchain: {
            startFetchingContract(address: Address): Promise<SmartContract>;
            getContract(address: Address): Promise<SmartContract>;
            increaseLt(): void;
            getLibs(): Cell | undefined;
            setLibs(libs: Cell | undefined): void;
            getAutoDeployLibs(): boolean;
            registerTxsForCoverage(txs: BlockchainTransaction[]): void;
            addTransaction(transaction: BlockchainTransaction): void;
        },
    ) {}

    public async pushMessage(message: Message | Cell) {
        const msg = message instanceof Cell ? loadMessage(message.beginParse()) : message;
        if (msg.info.type === 'external-out') {
            throw new Error('Cannot send external out message');
        }
        await this.lock.with(async () => {
            this.messageQueue.push({
                type: 'message',
                ...msg,
            });
        });
    }

    public async pushTickTock(on: Address, which: TickOrTock) {
        await this.lock.with(async () => {
            this.messageQueue.push({
                type: 'ticktock',
                on,
                which,
            });
        });
    }

    public async runQueue(params?: MessageParams): Promise<SendMessageResult> {
        const txes = await this.processQueue(params);
        return {
            transactions: txes,
            events: txes.map((tx) => tx.events).flat(),
            externals: txes.map((tx) => tx.externals).flat(),
        };
    }

    public runQueueIter(
        needsLocking: boolean,
        params?: MessageParams,
    ): AsyncIterator<BlockchainTransaction> & AsyncIterable<BlockchainTransaction> {
        const it = {
            next: () => this.processTx(needsLocking, params),
            [Symbol.asyncIterator]() {
                return it;
            },
        };
        return it;
    }

    protected async processTx(
        needsLocking: boolean,
        params?: MessageParams,
    ): Promise<IteratorResult<BlockchainTransaction>> {
        // Lock only if not locked already
        return needsLocking
            ? await this.lock.with(async () => this.processMessage(params))
            : await this.processMessage(params);
    }

    protected async processQueue(params?: MessageParams) {
        const results = await this.lock.with(async () => {
            // Locked already
            const txs = this.runQueueIter(false, params);
            const result: BlockchainTransaction[] = [];

            for await (const tx of txs) {
                result.push(tx);
            }

            return result;
        });
        this.blockchain.registerTxsForCoverage(results);
        return results;
    }

    protected async processMessage(params?: MessageParams): Promise<IteratorResult<BlockchainTransaction>> {
        let result: BlockchainTransaction | undefined = undefined;
        let done = this.messageQueue.length == 0;
        while (!done) {
            const message = this.messageQueue.shift()!;

            let tx: SmartContractTransaction;
            let smartContract: SmartContract;
            if (message.type === 'message') {
                if (message.info.type === 'external-out') {
                    done = this.messageQueue.length == 0;
                    continue;
                }

                this.blockchain.increaseLt();
                smartContract = await this.blockchain.getContract(message.info.dest);
                tx = await smartContract.receiveMessage(message, params);
            } else {
                this.blockchain.increaseLt();
                smartContract = await this.blockchain.getContract(message.on);
                tx = await smartContract.runTickTock(message.which, params);
            }

            const transaction: BlockchainTransaction = {
                ...tx,
                events: extractEvents(tx),
                parent: message.parentTransaction,
                children: [],
                externals: [],
                mode: message.type === 'message' ? message.mode : undefined,
            };
            transaction.parent?.children.push(transaction);

            this.blockchain.addTransaction(transaction);
            result = transaction;
            done = true;

            const sendMsgActions = (transaction.outActions?.filter((action) => action.type === 'sendMsg') ??
                []) as OutActionSendMsg[];

            for (const [index, message] of transaction.outMessages) {
                if (message.info.type === 'external-out') {
                    transaction.externals.push({
                        info: {
                            type: 'external-out',
                            src: message.info.src,
                            dest: message.info.dest ?? undefined,
                            createdAt: message.info.createdAt,
                            createdLt: message.info.createdLt,
                        },
                        init: message.init ?? undefined,
                        body: message.body,
                    });
                    continue;
                }

                this.messageQueue.push({
                    type: 'message',
                    parentTransaction: transaction,
                    mode: sendMsgActions[index]?.mode,
                    ...message,
                });

                if (message.info.type === 'internal') {
                    this.blockchain.startFetchingContract(message.info.dest);
                }
            }

            const isMasterchain = smartContract.account?.account?.addr.workChain === -1;
            if (isMasterchain && this.blockchain.getAutoDeployLibs()) {
                this.blockchain.setLibs(this.applyLibraryActions(this.blockchain.getLibs(), transaction?.outActions));
            }
        }
        return result === undefined ? { value: result, done: true } : { value: result, done: false };
    }

    private applyLibraryActions(originalLibraries?: Cell, outActions?: OutActionExtended[]): Cell | undefined {
        if (!outActions) {
            return originalLibraries;
        }

        const changeLibraryActions = outActions.filter(
            (action): action is OutActionChangeLibrary => action.type === 'changeLibrary',
        );

        if (changeLibraryActions.length === 0) {
            return originalLibraries;
        }

        const keyType = Dictionary.Keys.Buffer(32);
        const valueType = Dictionary.Values.Cell();

        const libsDict =
            originalLibraries?.beginParse().loadDictDirect(keyType, valueType) ?? Dictionary.empty(keyType, valueType);

        for (const action of changeLibraryActions) {
            let { mode, libRef } = action;

            mode &= ~16;

            if (mode === 0) {
                // eslint-disable-next-line no-console
                console.warn('Removing libraries not supported');
            } else if (mode === 1) {
                // eslint-disable-next-line no-console
                console.warn('Private libraries are not supported');
            } else if (mode === 2) {
                if (libRef.type !== 'ref') {
                    throw new Error('When deploying a library, libRef should be a cell, not a hash');
                }

                const { library } = libRef;
                libsDict.set(library.hash(), library);
            } else {
                throw new Error(`Unknown changeLibraryAction mode ${mode}`);
            }
        }

        if (libsDict.keys().length === 0) {
            return originalLibraries;
        }

        return beginCell().storeDictDirect(libsDict).endCell();
    }
}
