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
        const contractDatabase = ContractDatabase.from({
            '0xd992502b94ea96e7b34e5d62ffb0c6fc73d78b3e61f11f0848fb3a1eb1afc912': 'TreasuryContract',
            TreasuryContract: {
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
        expect(snapshot.label).toEqual('foo');
        expect(snapshot.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(snapshot.items).toMatchSnapshot();
    });
});
