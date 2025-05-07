import '@ton/test-utils';
import { beginCell, toNano } from '@ton/core';
import { Blockchain } from '../blockchain/Blockchain';
import { createMetricStore, getMetricStore, makeSnapshotMetric } from './collectMetric';
import { BenchmarkCommand } from '../jest/BenchmarkCommand';
import { ContractDatabase } from './ContractDatabase';

const bc = new BenchmarkCommand();
const itIf = (condition: boolean) => (condition ? it : it.skip);

async function simpleCase() {
    const blockchain = await Blockchain.create();
    const [alice, bob] = await blockchain.createWallets(2);
    const res1 = await alice.send({
        to: bob.address,
        value: toNano('1'),
        body: beginCell().storeUint(0xdeadface, 32).endCell(),
    });
    expect(res1.transactions).toHaveTransaction({
        from: alice.address,
        to: bob.address,
        success: true,
    });
    const res2 = await bob.send({
        to: alice.address,
        value: toNano('1'),
        body: beginCell().storeUint(0xffffffff, 32).endCell(),
    });
    expect(res2.transactions).toHaveTransaction({
        from: bob.address,
        to: alice.address,
        success: true,
    });
}

describe('collectMetric', () => {
    itIf(!bc.doBenchmark)('should not collect metric', async () => {
        let context: any = {};
        await simpleCase();
        expect(getMetricStore(context)).toEqual(undefined);
    });

    itIf(!bc.doBenchmark)('should be collect metric', async () => {
        const store = createMetricStore();
        expect(store.length).toEqual(0);
        await simpleCase();
        expect(store.length).toEqual(4);
        const contractDatabase = ContractDatabase.form({
            '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912': {
                name: 'TreasuryContract',
                types: [{ name: 'foo', header: Number('0xdeadface'), fields: [] }],
                receivers: [
                    {
                        receiver: 'internal',
                        message: { kind: 'typed', type: 'foo' },
                    },
                ],
            },
        });
        const snapshot = makeSnapshotMetric('foo', store, {
            contractDatabase,
        });
        expect(snapshot.comment).toEqual('foo');
        expect(snapshot.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(snapshot.items).toEqual([
            {
                testName: 'collectMetric should be collect metric',
                address: 'EQBiA46W-PQaaZZNFIDglnVknV9CR6J5hs81bSv70FwfNTrD',
                codeHash: '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912',
                contractName: 'TreasuryContract',
                methodName: 'send',
                receiver: 'external-in',
                opCode: '0x0',
                computePhase: {
                    exitCode: 0,
                    gasUsed: 1937,
                    success: true,
                    type: 'vm',
                    vmSteps: 50,
                },
                actionPhase: {
                    resultCode: 0,
                    skippedActions: 0,
                    success: true,
                    totalActionFees: 1,
                    totalActions: 1,
                    totalFwdFees: 400000,
                },
                outMessages: {
                    bits: 744,
                    cells: 2,
                },
                state: {
                    bits: 714,
                    cells: 5,
                },
            },
            {
                testName: 'collectMetric should be collect metric',
                address: 'EQBc3CG3NOeF3wwkBM8zjXrsWUhjLuN45LobSkZHXCR0jhvg',
                codeHash: '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912',
                contractName: 'TreasuryContract',
                receiver: 'internal',
                methodName: 'foo',
                opCode: '0xdeadface',
                computePhase: {
                    type: 'vm',
                    success: true,
                    exitCode: 0,
                    gasUsed: 309,
                    vmSteps: 5,
                },
                actionPhase: {
                    success: true,
                    resultCode: 0,
                    skippedActions: 0,
                    totalActionFees: 0,
                    totalActions: 0,
                    totalFwdFees: 0,
                },
                outMessages: {
                    bits: 0,
                    cells: 0,
                },
                state: {
                    bits: 714,
                    cells: 5,
                },
            },
            {
                testName: 'collectMetric should be collect metric',
                address: 'EQBc3CG3NOeF3wwkBM8zjXrsWUhjLuN45LobSkZHXCR0jhvg',
                codeHash: '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912',
                contractName: 'TreasuryContract',
                methodName: 'send',
                opCode: '0x0',
                receiver: 'external-in',
                computePhase: {
                    exitCode: 0,
                    gasUsed: 1937,
                    success: true,
                    type: 'vm',
                    vmSteps: 50,
                },
                actionPhase: {
                    resultCode: 0,
                    skippedActions: 0,
                    success: true,
                    totalActionFees: 1,
                    totalActions: 1,
                    totalFwdFees: 400000,
                },
                outMessages: {
                    bits: 744,
                    cells: 2,
                },

                state: {
                    bits: 714,
                    cells: 5,
                },
            },
            {
                testName: 'collectMetric should be collect metric',
                address: 'EQBiA46W-PQaaZZNFIDglnVknV9CR6J5hs81bSv70FwfNTrD',
                codeHash: '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912',
                contractName: 'TreasuryContract',
                methodName: 'notSupported',
                opCode: '0xffffffff',
                receiver: 'internal',
                actionPhase: {
                    resultCode: 0,
                    skippedActions: 0,
                    success: true,
                    totalActionFees: 0,
                    totalActions: 0,
                    totalFwdFees: 0,
                },
                computePhase: {
                    exitCode: 0,
                    gasUsed: 309,
                    success: true,
                    type: 'vm',
                    vmSteps: 5,
                },
                outMessages: {
                    bits: 0,
                    cells: 0,
                },
                state: {
                    bits: 714,
                    cells: 5,
                },
            },
        ]);
    });
});
