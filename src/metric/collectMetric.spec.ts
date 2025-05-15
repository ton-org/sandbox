import '@ton/test-utils';
import { createMetricStore, getMetricStore, makeSnapshotMetric, resetMetricStore } from './collectMetric';
import { BenchmarkCommand } from '../jest/BenchmarkCommand';
import { ContractDatabase } from './ContractDatabase';
import { itIf, simpleCase } from './fixtures/data.fixture';

const bc = new BenchmarkCommand();

describe('collectMetric', () => {
    itIf(!bc.doBenchmark)('should not collect metric', async () => {
        let context: any = {};
        await simpleCase();
        expect(getMetricStore(context)).toEqual(undefined);
    });

    itIf(!bc.doBenchmark)('should be collect metric', async () => {
        const store = createMetricStore();
        resetMetricStore();
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
        const snapshot = makeSnapshotMetric(store, {
            label: 'foo',
            contractDatabase,
        });
        expect(snapshot.label).toEqual('foo');
        expect(snapshot.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(snapshot.items).toMatchSnapshot();
    });

    itIf(!bc.doBenchmark)('should be collect abi', async () => {
        const store = createMetricStore();
        resetMetricStore();
        expect(store.length).toEqual(0);
        await simpleCase();
        expect(store.length).toEqual(4);
        const contractDatabase = ContractDatabase.from({});
        const snapshot = makeSnapshotMetric(store, {
            label: 'foo',
            contractDatabase,
        });
        expect(snapshot.label).toEqual('foo');
        expect(snapshot.createdAt.getTime()).toBeLessThanOrEqual(new Date().getTime());
        expect(contractDatabase.data).toMatchSnapshot();
    });
});
