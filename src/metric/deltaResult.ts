import {
    AddressFriendly,
    ContractMethodName,
    ContractName,
    Metric,
    OpCode,
    SnapshotMetric,
    sortByCreatedAt,
} from './collectMetric';

export type KindDelta = 'undefined' | 'init' | 'same' | 'increase' | 'decrease';

export type PathDelta = string;

export type ItemDelta = {
    kind: KindDelta;
    path: PathDelta;
    before: number;
    after: number;
};

export type ListDelta = Record<PathDelta, ItemDelta>;

export type DeltaMetric = {
    kind: KindDelta;
    value: string;
};

export const undefinedDeltaMetric = () =>
    ({
        kind: 'undefined',
        value: '~',
    }) as DeltaMetric;

export type ColorDelta = (metric: DeltaMetric) => string;

export type DeltaMetrics = Record<string, DeltaMetric>;

export type MethodDelta = Record<ContractMethodName | OpCode, DeltaMetrics>;

export type ContractDelta = Record<ContractName | AddressFriendly, MethodDelta>;

export type DeltaResult = {
    label: string;
    createdAt: Date;
    result: ContractDelta;
};

export type DeltaRow = [contract: string, method: string, ...values: DeltaMetric[]];

export type FlatDeltaResult = {
    header: string[];
    rows: DeltaRow[];
};

export function toFlatDeltaResult(deltas: DeltaResult[]): { header: string[]; rows: DeltaRow[] } {
    const out: FlatDeltaResult = {
        header: ['Contract', 'Method'],
        rows: [],
    };
    const contractSet = new Set<string>();
    const methodMap = new Map<string, Set<string>>();
    const metricSet = new Set<string>();

    for (const delta of deltas) {
        for (const [contract, methods] of Object.entries(delta.result)) {
            contractSet.add(contract);
            if (!methodMap.has(contract)) {
                methodMap.set(contract, new Set());
            }

            for (const [method, metrics] of Object.entries(methods)) {
                methodMap.get(contract)!.add(method);

                for (const metric of Object.keys(metrics)) {
                    metricSet.add(metric);
                }
            }
        }
    }
    const metricNames = Array.from(metricSet.values());
    out.header.push(...Array.from({ length: deltas.length }, () => metricNames).flat());

    for (const contract of contractSet) {
        const methods = methodMap.get(contract)!;
        for (const method of methods) {
            const metrics: DeltaMetric[] = [];
            for (const delta of deltas) {
                for (const metric of metricNames) {
                    metrics.push(delta.result?.[contract]?.[method]?.[metric] ?? undefinedDeltaMetric());
                }
            }
            out.rows.push([contract, method, ...metrics]);
        }
    }
    return out;
}

const aggregateTarget = ['cells', 'bits', 'gasUsed'];
const statusTarget = ['success', 'exitCode', 'resultCode'];
const deltaTarget = [
    ...aggregateTarget,
    ...statusTarget,
    'vmSteps',
    'totalActions',
    'skippedActions',
    'totalActionFees',
    'data',
    'code',
    'state',
    'message',
    'in',
    'out',
    'execute',
    'compute',
    'action',
];

/**
 * Recursively collects the sum of all numeric fields named `needle` within an arbitrary data structure
 */
function sumDeep(source: unknown, needle: string): number {
    if (source === null || typeof source !== 'object') {
        return 0;
    }

    if (Array.isArray(source)) {
        return source.map((item) => sumDeep(item, needle)).reduce((total, current) => total + current, 0);
    }

    let total = 0;
    for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
        if (key === needle && typeof value === 'number') {
            total += value;
            continue;
        }
        total += sumDeep(value, needle);
    }

    return total;
}

export function aggregatedCompareMetric(before: Metric, after: Metric, basePath: string[] = []): ListDelta {
    const out: ListDelta = {};
    const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
    keys.forEach((key) => {
        if (!deltaTarget.includes(key)) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prev = (before as any)[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const next = (after as any)[key];
        const path = [...basePath, key];

        if (prev === undefined || next === undefined) return;

        if (typeof prev === 'object' && typeof next === 'object') {
            Object.assign(out, aggregatedCompareMetric(prev, next, path));
            aggregateTarget.forEach((aggKey) => {
                const beforeSum = sumDeep(prev, aggKey);
                const afterSum = sumDeep(next, aggKey);
                const aggPath = [...path, aggKey].join('.');
                out[aggPath] = {
                    kind: beforeSum > afterSum ? 'decrease' : beforeSum < afterSum ? 'increase' : 'same',
                    path: aggPath,
                    before: beforeSum,
                    after: afterSum,
                };
            });
            return;
        }

        if (typeof prev === 'number' && typeof next === 'number') {
            const fullPath = path.join('.');
            out[fullPath] = {
                kind: prev > next ? 'decrease' : prev < next ? 'increase' : 'same',
                path: fullPath,
                before: prev,
                after: next,
            };
        }
    });

    if (basePath.length === 0) {
        aggregateTarget.forEach((aggKey) => {
            const beforeSum = sumDeep(before, aggKey);
            const afterSum = sumDeep(after, aggKey);
            const rootPath = `root.${aggKey}`;
            out[rootPath] = {
                kind: beforeSum > afterSum ? 'decrease' : beforeSum < afterSum ? 'increase' : 'same',
                path: rootPath,
                before: beforeSum,
                after: afterSum,
            };
        });
    }
    return out;
}

function prepareItemDelta(item?: ItemDelta, calcDelta = true): DeltaMetric {
    const out: DeltaMetric = undefinedDeltaMetric();
    if (!item) {
        return out;
    }
    out.kind = calcDelta ? item.kind : 'init';
    out.value = item.after.toString();
    if (calcDelta) {
        let change = item.kind === 'increase' ? ' +' : ' ';
        if (item.kind === 'same') {
            change += 'same';
        } else if (item.before === 0) {
            change += '100.00%';
        } else {
            change += (((item.after - item.before) / item.before) * 100).toFixed(2) + '%';
        }
        out.value += change;
    }
    return out;
}

export function prepareDelta(pair: { after: SnapshotMetric; before?: SnapshotMetric }): DeltaResult {
    const result: ContractDelta = {};
    const out: DeltaResult = {
        label: pair.after.label,
        createdAt: pair.after.createdAt,
        result,
    };

    const beforeMap = new Map<string, Map<string, Metric>>();
    if (pair.before) {
        for (const b of pair.before.items) {
            const contractKey = b.contractName || b.address;
            const methodKey = b.methodName || b.opCode;
            if (!beforeMap.has(contractKey)) {
                beforeMap.set(contractKey, new Map());
            }
            beforeMap.get(contractKey)!.set(methodKey, b);
        }
    }

    for (const a of pair.after.items) {
        const contractKey = a.contractName || a.address;
        const methodKey = a.methodName || a.opCode;

        const b = beforeMap.get(contractKey)?.get(methodKey); // может быть undefined
        const calcDelta = !!b;

        if (!result[contractKey]) {
            result[contractKey] = {};
        }

        const item: Record<string, DeltaMetric> = {};
        result[contractKey][methodKey] = item;

        const delta = aggregatedCompareMetric(b || a, a);
        item.gasUsed = prepareItemDelta(delta['execute.compute.gasUsed'], calcDelta);
        item.cells = prepareItemDelta(delta['state.cells'], calcDelta);
        item.bits = prepareItemDelta(delta['state.bits'], calcDelta);
    }

    return out;
}

export function makeGasReport(list: SnapshotMetric[]): Array<DeltaResult> {
    list = (list || []).sort(sortByCreatedAt());
    const out: DeltaResult[] = [];
    if (list.length === 0) return out;
    for (let i = 0; i < list.length; i++) {
        const after = list[i];
        const before = i > 0 ? list[i - 1] : undefined;
        out.push(prepareDelta({ after, before }));
    }
    return out;
}
