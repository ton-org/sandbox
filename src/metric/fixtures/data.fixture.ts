import { beginCell, toNano } from '@ton/core';

import { makeSnapshotMetric, Metric, SnapshotMetric } from '../collectMetric';
import { Blockchain } from '../../blockchain/Blockchain';

// eslint-disable-next-line no-undef
export const itIf = (condition: boolean) => (condition ? it : it.skip);

export const zero: Metric = {
    address: 'EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G',
    opCode: '0x0',
    execute: {
        compute: {
            type: 'vm',
            success: true,
            gasUsed: 0,
            exitCode: 0,
            vmSteps: 0,
        },
        action: {
            success: true,
            totalActions: 0,
            skippedActions: 0,
            resultCode: 0,
            totalActionFees: 0,
            totalFwdFees: 0,
            totalMessageSize: {
                cells: 0,
                bits: 0,
            },
        },
    },
    message: {
        in: {
            cells: 0,
            bits: 0,
        },
        out: {
            cells: 0,
            bits: 0,
        },
    },
    state: {
        code: {
            cells: 0,
            bits: 0,
        },
        data: {
            cells: 0,
            bits: 0,
        },
    },
};

export const one: Metric = {
    address: 'EQBGhqLAZseEqRXz4ByFPTGV7SVMlI4hrbs-Sps_Xzx01x8G',
    opCode: '0x0',
    execute: {
        compute: {
            type: 'vm',
            success: true,
            gasUsed: 1,
            exitCode: 0,
            vmSteps: 1,
        },
        action: {
            success: true,
            totalActions: 1,
            skippedActions: 1,
            resultCode: 0,
            totalActionFees: 1,
            totalFwdFees: 1,
            totalMessageSize: {
                cells: 1,
                bits: 1,
            },
        },
    },
    message: {
        in: {
            cells: 1,
            bits: 1,
        },
        out: {
            cells: 1,
            bits: 1,
        },
    },
    state: {
        code: {
            cells: 1,
            bits: 1,
        },
        data: {
            cells: 1,
            bits: 1,
        },
    },
};

const oneFirst = makeSnapshotMetric([one], { label: 'one first' });
oneFirst.createdAt = new Date('2009-01-03T00:00:00Z');
const zeroFirst = makeSnapshotMetric([zero], { label: 'zero first' });
zeroFirst.createdAt = new Date('2009-01-03T00:00:00Z');
const oneSecond = makeSnapshotMetric([one], { label: 'one second' });
oneSecond.createdAt = new Date('2009-01-03T00:00:01Z');
const zeroSecond = makeSnapshotMetric([zero], { label: 'zero second' });
zeroSecond.createdAt = new Date('2009-01-03T00:00:01Z');

export { oneFirst, zeroFirst, oneSecond, zeroSecond };

export const simpleSnapshot: SnapshotMetric = {
    label: 'simple',
    createdAt: new Date(),
    items: [zero],
};

export async function simpleCase() {
    const blockchain = await Blockchain.create();
    const [alice, bob] = await blockchain.createWallets(2);
    await alice.send({
        to: bob.address,
        value: toNano('1'),
        body: beginCell().storeUint(0xdeadface, 32).endCell(),
    });
    await bob.send({
        to: alice.address,
        value: toNano('1'),
        body: beginCell().storeUint(0xffffffff, 32).endCell(),
    });
}
