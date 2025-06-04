import { Address, beginCell, Cell, Contract, storeMessage, Message } from '@ton/core';
import { Dictionary, DictionaryKeyTypes, TransactionComputePhase } from '@ton/core';
import { Maybe } from '@ton/core/src/utils/maybe';

import { Blockchain, SendMessageResult } from '../blockchain/Blockchain';
import { ContractDatabase } from './ContractDatabase';

export type MetricContext<T extends Contract> = {
    contract: T;
    methodName: string;
};

type StateShort = {
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
    success: boolean;
    totalActions: number;
    skippedActions: number;
    resultCode: number;
    totalFwdFees?: number;
    totalActionFees: number;
    totalMessageSize: CellMetric;
};

export type AddressFriendly = string;

export function isAddressFriendly(value: unknown): value is AddressFriendly {
    return typeof value === 'string' && Address.isFriendly(value);
}

export type ContractName = string;

export type ContractMethodName = string;

export type CodeHash = `0x${string}`;

export type OpCode = `0x${string}`;

export function isCodeHash(value: unknown): value is CodeHash {
    return typeof value === 'string' && value.length === 66 && /^0x[0-9a-fA-F]+$/.test(value);
}

export type StateMetric = {
    code: CellMetric;
    data: CellMetric;
};

export type Metric = {
    // the name of the current test (if available in Jest context)
    testName?: string;
    // address of contract
    address: AddressFriendly;
    // hex-formatted hash of contract code
    codeHash?: CodeHash;
    // total cells and bits usage of the contract's code and data
    state: StateMetric;
    contractName?: ContractName;
    methodName?: ContractMethodName;
    receiver?: 'internal' | 'external-in' | 'external-out';
    opCode: OpCode;
    // information from transaction phases
    execute: {
        compute: ComputePhaseMetric;
        action?: ActionPhaseMetric;
    };
    // total cells and bits usage of inbound and outbound messages
    message: {
        in: CellMetric;
        out: CellMetric;
    };
};

export type SnapshotMetric = {
    label: string;
    createdAt: Date;
    items: Metric[];
};

interface HasCreatedAt {
    createdAt: Date;
}

export function sortByCreatedAt(reverse = false) {
    return (a: HasCreatedAt, b: HasCreatedAt) => (a.createdAt.getTime() - b.createdAt.getTime()) * (reverse ? -1 : 1);
}

export type SnapshotMetricFile = {
    name: string;
    content: SnapshotMetric;
};

export type SnapshotMetricList = Record<string, SnapshotMetricFile>;

export type SnapshotMetricConfig = {
    label: string;
    contractExcludes: ContractName[];
    contractDatabase: ContractDatabase;
};

const STORE_METRIC = Symbol.for('ton-sandbox-metric-store');

export function makeSnapshotMetric(store: Metric[], config: Partial<SnapshotMetricConfig> = {}): SnapshotMetric {
    const label = config.label || 'current';
    const contractExcludes = config.contractExcludes || new Array<ContractName>();
    const contractDatabase = config.contractDatabase || ContractDatabase.from({});
    const snapshot: SnapshotMetric = {
        label,
        createdAt: new Date(),
        items: new Array<Metric>(),
    };
    // remove duplicates and extract ABI
    const seen = new Set<string>();
    for (const metric of store) {
        const key = JSON.stringify(metric);
        if (seen.has(key)) continue;
        snapshot.items.push(metric);
        seen.add(key);
        if (metric.codeHash) {
            contractDatabase.extract(metric);
        }
    }
    // ABI auto-mapping
    for (const item of snapshot.items) {
        const find = contractDatabase.by(item);
        if (!item.contractName && find.contractName) {
            item.contractName = find.contractName;
        }
        if (!item.methodName && find.methodName) {
            item.methodName = find.methodName;
        }
    }
    if (contractExcludes.length > 0) {
        snapshot.items = snapshot.items.filter(
            (it) => typeof it.contractName === 'undefined' || !contractExcludes.includes(it.contractName),
        );
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

export function resetMetricStore(context: any = globalThis): Array<Metric> {
    const store = getMetricStore(context);
    if (store) store.length = 0;
    return createMetricStore(context);
}

export function calcMessageSize(msg: Maybe<Message>) {
    if (msg) {
        return calcCellSize(beginCell().store(storeMessage(msg)).endCell());
    }
    return { cells: 0, bits: 0 };
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
    const out = {
        cells: 1,
        bits: root.bits.length,
    };
    for (const ref of root.refs) {
        const childRes = calcCellSize(ref, visited);
        out.cells += childRes.cells;
        out.bits += childRes.bits;
    }
    return out;
}

export function calcStateSize(state: StateShort): StateMetric {
    const codeSize = calcCellSize(state.code);
    const dataSize = calcCellSize(state.data);
    return {
        code: codeSize,
        data: dataSize,
    };
}

export function calcComputePhase(phase: TransactionComputePhase): ComputePhaseMetric {
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

export enum OpCodeReserved {
    send = 0x0,
    notSupported = 0xffffffff,
    notAllowed = 0xfffffffe,
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
    let state: StateMetric = { data: { cells: 0, bits: 0 }, code: { cells: 0, bits: 0 } };
    let codeHash: CodeHash | undefined;
    if (ctx.contract.init && ctx.contract.init.code && ctx.contract.init.data) {
        codeHash = `0x${ctx.contract.init.code.hash().toString('hex')}`;
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
        // eslint-disable-next-line no-undef
        testName = expect.getState().currentTestName;
    }
    let contractName: ContractName | undefined = ctx.contract.constructor.name;
    let methodName: ContractMethodName | undefined = ctx.methodName;

    for (const tx of result.transactions) {
        if (tx.description.type !== 'generic') continue;
        const receiver = tx.inMessage?.info.type;
        const body = tx.inMessage?.body ? tx.inMessage.body.beginParse() : undefined;
        let opCode: OpCode = '0x0';
        if (receiver === 'internal') {
            opCode = `0x${(body && body.remainingBits >= 32 ? body.preloadUint(32) : 0).toString(16)}`;
        }
        if (!methodName && Object.values(OpCodeReserved).includes(Number(opCode))) {
            methodName = OpCodeReserved[Number(opCode)];
        }
        const address = Address.parseRaw(`0:${tx.address.toString(16).padStart(64, '0')}`);

        const { computePhase, actionPhase } = tx.description;
        const action: ActionPhaseMetric | undefined = actionPhase
            ? {
                  success: actionPhase.success,
                  totalActions: actionPhase.totalActions,
                  skippedActions: actionPhase.skippedActions,
                  resultCode: actionPhase.resultCode,
                  totalActionFees: actionPhase.totalActions,
                  totalFwdFees: actionPhase.totalFwdFees ? Number(actionPhase.totalFwdFees) : undefined,
                  totalMessageSize: {
                      cells: Number(actionPhase.totalMessageSize.cells),
                      bits: Number(actionPhase.totalMessageSize.bits),
                  },
              }
            : undefined;
        const compute = calcComputePhase(computePhase);
        const metric: Metric = {
            testName,
            address: address.toString(),
            codeHash,
            contractName,
            methodName,
            receiver,
            opCode,
            execute: {
                compute,
                action,
            },
            message: {
                in: calcMessageSize(tx.inMessage),
                out: calcDictSize(tx.outMessages),
            },
            state,
        };
        store.push(metric);
        methodName = undefined;
        if (!address.equals(ctx.contract.address)) {
            contractName = ctx.contract.constructor.name;
        } else {
            contractName = undefined;
        }
    }
}
