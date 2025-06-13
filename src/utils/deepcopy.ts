function deepcopyBuffer(buffer: Buffer | undefined): Buffer | undefined {
    if (!buffer) return;

    const newBuffer = Buffer.alloc(buffer.length);
    buffer.copy(newBuffer);
    return newBuffer;
}

type Primitive = undefined | null | boolean | number | string | bigint | symbol;

type DeepCopiable = Primitive | Buffer | DeepCopiable[] | { [key: string | number | symbol]: DeepCopiable };

export function deepcopy<T extends DeepCopiable>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (Buffer.isBuffer(obj)) {
        return deepcopyBuffer(obj) as T;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => deepcopy(item)) as T;
    }

    if (typeof obj === 'object') {
        const result: { [key: string]: DeepCopiable } = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = deepcopy(value);
        }
        return result as T;
    }

    return obj;
}
