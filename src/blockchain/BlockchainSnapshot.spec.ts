import { randomAddress } from '@ton/test-utils';
import { beginCell, Cell, storeShardAccount, toNano } from '@ton/core';

import { Blockchain } from './Blockchain';
import { internal } from '../utils/message';
import { createShardAccount } from './SmartContract';
import { snapshotFromSerializable, snapshotToSerializable } from './BlockchainSnapshot';

describe('BlockchainSnapshot', () => {
    it('should store and restore snapshot', async () => {
        const blockchain = await Blockchain.create();

        blockchain.recordStorage = true;
        blockchain.verbosity = {
            blockchainLogs: true,
            print: false,
            vmLogs: 'vm_logs_verbose',
            debugLogs: false,
        };

        const from = randomAddress();
        const to = randomAddress();
        await blockchain.setShardAccount(
            from,
            createShardAccount({
                address: from,
                balance: toNano(10),
                code: beginCell().storeUint(1, 1).endCell(),
                data: Cell.EMPTY,
            }),
        );
        await blockchain.setShardAccount(
            to,
            createShardAccount({
                address: to,
                balance: toNano(10),
                code: beginCell().storeUint(1, 1).endCell(),
                data: Cell.EMPTY,
            }),
        );

        await blockchain.sendMessage(internal({ from, to, value: toNano(0.5), bounce: true }));

        blockchain.libs = beginCell().storeStringTail('mock').endCell();
        blockchain.autoDeployLibraries = true;
        await blockchain.randomize();

        const snapshot = blockchain.snapshot();

        const serializableSnapshot = snapshotToSerializable(snapshot);
        const serialized = JSON.stringify(serializableSnapshot);
        const deserialized = JSON.parse(serialized);
        const restored = snapshotFromSerializable(deserialized);

        expect(restored.networkConfig).toEqual(snapshot.networkConfig);
        expect(restored.lt).toEqual(snapshot.lt);
        expect(restored.time).toEqual(snapshot.time);
        expect(restored.nextCreateWalletIndex).toEqual(snapshot.nextCreateWalletIndex);
        expect(restored.autoDeployLibs).toEqual(snapshot.autoDeployLibs);
        expect(restored.verbosity).toEqual(snapshot.verbosity);
        expect(restored.randomSeed!.equals(snapshot.randomSeed!)).toBeTruthy();
        expect(restored.libs).toEqualCell(snapshot.libs!);

        expect(restored.contracts.length).toBe(snapshot.contracts.length);
        for (let i = 0; i < snapshot.contracts.length; i++) {
            expect(restored.contracts[i].address).toEqualAddress(snapshot.contracts[i].address);
            expect(restored.contracts[i].lastTxTime).toBe(snapshot.contracts[i].lastTxTime);
            expect(restored.contracts[i].verbosity).toEqual(snapshot.contracts[i].verbosity);

            const origAccount = beginCell().store(storeShardAccount(snapshot.contracts[i].account)).endCell();
            const restoredAccount = beginCell().store(storeShardAccount(restored.contracts[i].account)).endCell();
            expect(origAccount).toEqualCell(restoredAccount);
        }

        expect(restored.transactions.length).toBe(snapshot.transactions.length);
        for (let i = 0; i < snapshot.transactions.length; i++) {
            expect(restored.transactions[i].hash().toString('hex')).toEqual(
                snapshot.transactions[i].hash().toString('hex'),
            );
            expect(restored.transactions[i].blockchainLogs).toEqual(snapshot.transactions[i].blockchainLogs);
            expect(restored.transactions[i].vmLogs).toEqual(snapshot.transactions[i].vmLogs);
            expect(restored.transactions[i].debugLogs).toEqual(snapshot.transactions[i].debugLogs);
            expect(restored.transactions[i].mode).toEqual(snapshot.transactions[i].mode);

            expect(restored.transactions[i].oldStorage).toEqualCell(snapshot.transactions[i].oldStorage!);
            expect(restored.transactions[i].newStorage).toEqualCell(snapshot.transactions[i].newStorage!);

            if (restored.transactions[i].parent) {
                expect(
                    restored.transactions[i].parent!.hash().equals(restored.transactions[i].parent!.hash()),
                ).toBeTruthy();
            }

            expect(restored.transactions[i].children.map((tx) => tx.hash().toString('hex'))).toEqual(
                snapshot.transactions[i].children.map((tx) => tx.hash().toString('hex')),
            );
        }
    });
});
