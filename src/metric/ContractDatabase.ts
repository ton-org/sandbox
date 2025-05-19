import { ContractABI, ABIReceiver, ABIType } from '@ton/core';
import { CodeHash, Metric, OpCode, isCodeHash } from './collectMetric';

type Condition = {
    codeHash: CodeHash;
    opCode: OpCode;
    receiver: 'internal' | 'external-in' | 'external-out';
};

export type ContractDataKey = CodeHash | string;

export type ContractData = Record<ContractDataKey, ContractABI | ContractDataKey>;

export class ContractDatabase {
    protected list: Map<ContractDataKey, ContractABI>;
    protected match: Map<ContractDataKey, ContractDataKey>;

    constructor(abiList: Map<ContractDataKey, ContractABI>, codeHashMatch: Map<ContractDataKey, ContractDataKey>) {
        this.list = abiList;
        this.match = codeHashMatch;
    }

    static from(data: ContractData): ContractDatabase {
        const list = new Map<ContractDataKey, ContractABI>();
        const match = new Map<ContractDataKey, ContractDataKey>();
        (Object.entries(data) as [ContractDataKey, ContractABI | ContractDataKey][]).forEach(([key, value]) => {
            if ((isCodeHash(key) && typeof value === 'string') || (isCodeHash(value) && typeof key === 'string')) {
                match.set(key, value);
            } else if (!isCodeHash(value) && typeof value !== 'string') {
                list.set(key, value);
            }
        });
        return new ContractDatabase(list, match);
    }

    get data(): ContractData {
        const out: ContractData = {};
        for (const [key, value] of this.match) {
            out[key] = value;
        }
        for (const [key, value] of this.list) {
            out[key] = value;
        }
        return out;
    }

    origin(needle: ContractDataKey) {
        return this.match.get(needle) || needle;
    }

    get(needle: ContractDataKey) {
        return this.list.get(this.origin(needle));
    }

    extract(metric: Metric) {
        const abiKeyNeedle = metric.contractName || metric.codeHash;
        if (!abiKeyNeedle) {
            return;
        }
        const codeHash = metric.codeHash;
        if (isCodeHash(codeHash) && abiKeyNeedle !== codeHash) {
            this.match.set(codeHash, abiKeyNeedle);
        }
        const abiKey = this.origin(abiKeyNeedle);
        const abi = this.list.get(abiKey) || ({} as ContractABI);

        if (!abi.receivers) {
            abi.receivers = [];
        }
        if (!abi.types) {
            abi.types = [];
        }
        const find = this.by(metric);
        if (!find.methodName) {
            if (!abi.name) {
                abi.name = metric.contractName || metric.codeHash;
            }
            if (metric.opCode !== '0x0') {
                abi.types.push({
                    name: metric.methodName || metric.opCode,
                    header: Number(metric.opCode),
                } as ABIType);
                abi.receivers.push({
                    receiver: metric.receiver == 'internal' ? 'internal' : 'external',
                    message: {
                        kind: 'typed',
                        type: metric.methodName || metric.opCode,
                    },
                } as ABIReceiver);
            }
        }
        this.list.set(abiKey, abi);
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
