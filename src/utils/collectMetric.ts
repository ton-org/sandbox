import { Address, beginCell, Cell, Contract } from '@ton/core';
import { Dictionary, DictionaryKeyTypes, TransactionComputePhase } from '@ton/core';
import { Blockchain, SendMessageResult } from '../blockchain/Blockchain';

export type MetricContext<T extends Contract> = {
    contract: T;
    methodName: string;
};

export type State = {
    code: Cell;
    data: Cell;
};

export type CellMetric = {
    cells: number;
    bits: number;
};

export type ComputePhaseMetric = {
    type: string;
    success?: boolean;
    gasUsed?: number;
    exitCode?: number;
    vmSteps?: number;
};

export type ActionPhaseMetric = {
    success?: boolean;
    totalActions?: number;
    skippedActions?: number;
    resultCode?: number;
    totalFwdFees?: number;
    totalActionFees?: number;
};

export type Metric = {
    testName?: string;
    address: string;
    contractName: string | null;
    methodName: string | null;
    opCode: number;
    computePhase: ComputePhaseMetric;
    actionPhase: ActionPhaseMetric;
    outMessages: CellMetric;
    state: CellMetric;
};

export type SnapshotMetric = {
    comment: string;
    createdAt: Date;
    items: Metric[];
};

const STORE_METRIC = Symbol.for('ton-sandbox-metric-store');

export function makeSnapshotMetric(comment: string, store: Metric[]): SnapshotMetric {
    const snapshot: SnapshotMetric = {
        comment,
        createdAt: new Date(),
        items: new Array<Metric>(),
    };
    const seen = new Set<string>();
    for (const metric of store) {
        const key = JSON.stringify(metric);
        if (seen.has(key)) continue;
        snapshot.items.push(metric);
        seen.add(key);
    }
    return snapshot;
}

export function getMetricStore(context: any = globalThis): Array<Metric> | undefined {
    return context[STORE_METRIC];
}

export function createMetricStore(context: any = globalThis): Array<Metric> {
    if (!Array.isArray(context[STORE_METRIC])) {
        context[STORE_METRIC] = new Array<Metric>();
    }
    return context[STORE_METRIC];
}

export function calcDictSize<K extends DictionaryKeyTypes, V>(dict: Dictionary<K, V>) {
    if (dict.size > 0) {
        return calcCellSize(beginCell().storeDict(dict).endCell().asSlice().loadRef());
    }
    return { cells: 0, bits: 0 };
}

export function calcCellSize(root: Cell, visited: Set<string> = new Set<string>()) {
    const hash = root.hash().toString('hex');
    if (visited.has(hash)) {
        return { cells: 0, bits: 0 };
    }
    visited.add(hash);
    let cells = 1;
    let bits = root.bits.length;
    for (const ref of root.refs) {
        const childRes = calcCellSize(ref, visited);
        cells += childRes.cells;
        bits += childRes.bits;
    }
    return { cells, bits };
}

export function calcStateSize(state: State): CellMetric {
    const codeSize = calcCellSize(state.code);
    const dataSize = calcCellSize(state.data);
    return {
        cells: codeSize.cells + dataSize.cells,
        bits: codeSize.bits + dataSize.bits,
    };
}

export function computePhase(phase: TransactionComputePhase): ComputePhaseMetric {
    if (phase.type === 'vm') {
        return {
            type: phase.type,
            success: phase.success,
            gasUsed: Number(phase.gasUsed),
            exitCode: phase.exitCode,
            vmSteps: phase.vmSteps,
        };
    }
    return {
        type: phase.type,
    };
}

export async function collectMetric<T extends Contract>(
    blockchain: Blockchain,
    ctx: MetricContext<T>,
    result: SendMessageResult,
) {
    const store = getMetricStore();
    if (!Array.isArray(store)) {
        return;
    }
    let state: CellMetric = { cells: 0, bits: 0 };
    if (ctx.contract.init && ctx.contract.init.code && ctx.contract.init.data) {
        state = calcStateSize({ code: ctx.contract.init.code, data: ctx.contract.init.data });
    } else {
        const account = (await blockchain.getContract(ctx.contract.address)).accountState;
        if (account && account.type === 'active' && account.state.code && account.state.data) {
            codeHash = `0x${account.state.code.hash().toString('hex')}`;
            state = calcStateSize({ code: account.state.code, data: account.state.data });
        }
    }
    let testName;
    if ((globalThis as any)['expect']) {
        testName = expect.getState().currentTestName;
    }
    let contractName: string | null = ctx.contract.constructor.name;
    let methodName: string | null = ctx.methodName;

    for (const tx of result.transactions) {
        if (tx.description.type !== 'generic') continue;
        const body = tx.inMessage?.info.type === 'internal' ? tx.inMessage?.body.beginParse() : undefined;
        const opCode = body && body.remainingBits >= 32 ? body.preloadUint(32) : 0;
        const address = Address.parse(`0:${tx.address.toString(16)}`);
        const metric: Metric = {
            testName,
            address: address.toString(),
            contractName,
            methodName,
            opCode,
            computePhase: computePhase(tx.description.computePhase),
            actionPhase: {
                success: tx.description.actionPhase?.success,
                totalActions: tx.description.actionPhase?.totalActions,
                skippedActions: tx.description.actionPhase?.skippedActions,
                resultCode: tx.description.actionPhase?.resultCode,
                totalActionFees: tx.description.actionPhase?.totalActions,
                totalFwdFees: Number(tx.description.actionPhase?.totalFwdFees ?? 0),
            },
            outMessages: calcDictSize(tx.outMessages),
            state,
        };
        store.push(metric);
        methodName = null;
        if (!address.equals(ctx.contract.address)) {
            contractName = ctx.contract.constructor.name;
        } else {
            contractName = null;
        }
    }
}
