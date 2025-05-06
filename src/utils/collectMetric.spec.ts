import '@ton/test-utils';
import { beginCell, toNano } from '@ton/core';
import { Blockchain } from '../blockchain/Blockchain';
import { createMetricStore, getMetricStore, makeSnapshotMetric } from './collectMetric';

async function simpleCase() {
    const blockchain = await Blockchain.create();
    const [alice, bob] = await blockchain.createWallets(2);
    const res1 = await alice.send({
        to: bob.address,
        value: toNano('1'),
        body: beginCell().storeUint(3735943886, 32).endCell(),
    });
    expect(res1.transactions).toHaveTransaction({
        from: alice.address,
        to: bob.address,
        success: true,
    });
}

describe('collectMetric', () => {
    it('should not collect metric', async () => {
        await simpleCase();
        expect(getMetricStore()).toEqual(undefined);
    });

    it('should be collect metric', async () => {
        const store = createMetricStore();
        expect(store.length).toEqual(0);
        await simpleCase();
        expect(store.length).toEqual(2);
        const snapshot = makeSnapshotMetric('foo', store);
        expect(snapshot.comment).toEqual('foo');
        expect(snapshot.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(snapshot.items).toEqual([
            {
                testName: 'collectMetric should be collect metric',
                address: 'EQBiA46W-PQaaZZNFIDglnVknV9CR6J5hs81bSv70FwfNTrD',
                contractName: 'TreasuryContract',
                methodName: 'send',
                opCode: 0,
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
                contractName: null,
                methodName: null,
                opCode: 3735943886,
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
        ]);
    });
});
