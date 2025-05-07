import { ContractABI, ABIReceiver, ABIType } from '@ton/core';
import { CodeHash, Metric, OpCode } from './collectMetric';

type Condition = {
    codeHash: CodeHash;
    opCode: OpCode;
    receiver: 'internal' | 'external-in' | 'external-out';
};

export class ContractDatabase extends Map<CodeHash, ContractABI> {
    static form(data: Record<CodeHash, ContractABI>): ContractDatabase {
        const self = new ContractDatabase();
        for (const [hash, abi] of Object.entries(data) as [CodeHash, ContractABI][]) {
            self.set(hash, abi);
        }
        return self;
    }

    extract(metric: Metric) {
        if (metric.codeHash === undefined) {
            return;
        }
        const abi = this.get(metric.codeHash) || ({} as ContractABI);
        if (metric.contractName) {
            abi.name = metric.contractName;
        }
        if (metric.methodName) {
            if (!abi.receivers) {
                abi.receivers = [];
            }
            if (!abi.types) {
                abi.types = [];
            }
            abi.types.push({
                name: metric.methodName,
                header: Number(metric.opCode),
            } as ABIType);
            abi.receivers.push({
                receiver: metric.receiver == 'internal' ? 'internal' : 'external',
                message: {
                    kind: 'typed',
                    type: metric.methodName,
                },
            } as ABIReceiver);
        }
        this.set(metric.codeHash, abi);
    }

    by(where: Partial<Condition>): Partial<Metric> {
        if (!where.codeHash) {
            return {};
        }
        const abi = this.get(where.codeHash);
        if (!abi) {
            return {};
        }
        const out: Partial<Metric> = {};
        out.contractName = abi.name ? abi.name : undefined;
        let abiType: ABIType | undefined;
        if (where.opCode) {
            for (const item of abi.types || []) {
                if (item.header && item.header === Number(where.opCode)) {
                    abiType = item;
                    break;
                }
            }
        }
        if (abiType) {
            const receiver = where.receiver ? (where.receiver == 'internal' ? 'internal' : 'external') : undefined;
            for (const item of abi.receivers || []) {
                if (receiver && receiver !== item.receiver) {
                    continue;
                }
                if (item.message.kind === 'typed' && item.message.type == abiType.name) {
                    out.methodName = item.message.type;
                    break;
                }
            }
        }
        return out;
    }
}
