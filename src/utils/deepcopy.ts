import { Address, Cell, Dictionary, DictionaryKeyTypes } from '@ton/core';

import type { BlockchainTransaction } from '../blockchain/Blockchain';

function deepcopyBuffer(buffer: Buffer | undefined): Buffer | undefined {
    if (!buffer) return;

    const newBuffer = Buffer.alloc(buffer.length);
    buffer.copy(newBuffer);
    return newBuffer;
}

type Primitive = undefined | null | boolean | number | string | bigint | symbol;

type DeepCopiable =
    | Primitive
    | Buffer
    | Address
    | Cell
    | Map<DeepCopiable, DeepCopiable>
    | DeepCopiable[]
    | Partial<{ [key: Partial<string | number | symbol>]: DeepCopiable }>
    | Dictionary<DictionaryKeyTypes, DeepCopiable>;

function deepcopyDict(dict: Dictionary<DictionaryKeyTypes, unknown>) {
    const rawDict = dict as unknown as {
        _key: unknown;
        _value: unknown;
        _map: Map<string, unknown>;
    };
    // TODO: make pr to @ton/core with key, value and map fields
    // @ts-expect-error Accessing private constructor for cloning purposes
    return new Dictionary(deepcopy(rawDict._map), rawDict._key, rawDict._value);
}

export function deepcopyTransactions(transactions: BlockchainTransaction[]): BlockchainTransaction[] {
    return deepcopy(
        transactions.map((transaction) => ({
            ...transaction,
            children: [],
        })),
    );
}

export function restoreTransactions(transactions: BlockchainTransaction[]) {
    const copy = deepcopy(transactions);
    for (const transaction of copy) {
        transaction.parent?.children?.push(transaction);
    }
    return copy;
}

// TypeScript by design does not treat interfaces as structurally assignable to plain record types
// Related issue: https://github.com/microsoft/TypeScript/issues/15300
// This is a workaround
type InterfaceToType<T> = { [key in keyof T]: InterfaceToType<T[key]> };
type IsCopiable<T> = T extends DeepCopiable ? true : InterfaceToType<T> extends DeepCopiable ? true : false;

export function deepcopy<T extends IsCopiable<T> extends true ? unknown : DeepCopiable>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (Buffer.isBuffer(obj)) {
        return deepcopyBuffer(obj) as T;
    }

    // @ts-expect-error TS doesn't allow generic instantiation in instanceof anymore
    if (obj instanceof Dictionary<DictionaryKeyTypes, DeepCopiable>) {
        return deepcopyDict(obj);
    }

    if (Address.isAddress(obj)) {
        return new Address(obj.workChain, deepcopyBuffer(obj.hash)!) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepcopy(item)) as T;
    }

    if (obj instanceof Cell) {
        return obj;
    }

    if (obj instanceof Map) {
        const newMap = new Map();
        for (const [key, value] of obj) {
            newMap.set(deepcopy(key), deepcopy(value));
        }

        return newMap as T;
    }

    if (typeof obj === 'object') {
        if (obj.constructor && obj.constructor.name !== 'Object') {
            throw new Error(`Unknown class ${obj.constructor.name} passed to deepcopy`);
        }

        const result: { [key: string]: DeepCopiable } = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = deepcopy(value);
        }
        return result as T;
    }

    return obj;
}
