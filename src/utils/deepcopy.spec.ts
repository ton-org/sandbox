import { randomAddress } from '@ton/test-utils';

import { deepcopy } from './deepcopy';

describe('deepcopy', () => {
    it('should return same value for primitives', () => {
        expect(deepcopy(undefined)).toBeUndefined();
        expect(deepcopy(null)).toBeNull();
        expect(deepcopy(true)).toBe(true);
        expect(deepcopy(false)).toBe(false);
        expect(deepcopy(42)).toBe(42);
        expect(deepcopy('test')).toBe('test');
        expect(deepcopy(42n)).toBe(42n);
        const sym = Symbol('test');
        expect(deepcopy(sym)).toBe(sym);
    });

    it('should deep copy Buffer', () => {
        const buf = Buffer.from([1, 2, 3]);
        const copy = deepcopy(buf);
        expect(copy).toEqual(buf);

        copy[0] = 99;
        expect(buf[0]).toBe(1);
    });

    it('should deep copy Address', () => {
        const addr = randomAddress();
        addr.hash[0] = 1;

        const copy = deepcopy(addr);
        expect(addr.equals(copy)).toBeTruthy();

        addr.hash[0] = 99;
        expect(copy.hash[0]).toBe(1);
    });

    it('should deep copy arrays', () => {
        const arr = [1, 'test', Buffer.from([4]), null];
        const copy = deepcopy(arr);

        expect(copy).toEqual(arr);

        (copy[2] as Buffer)[0] = 200;
        expect((arr[2] as Buffer)[0]).toBe(4);
    });

    it('should deep copy objects with primitive and buffer values', () => {
        const original = {
            a: 1,
            b: 'str',
            c: Buffer.from([9]),
            d: {
                e: true,
                f: Buffer.from([7, 8]),
            },
        };

        const copy = deepcopy(original);

        expect(copy).not.toBe(original);
        expect(copy).toEqual(original);

        copy.c[0] = 0;
        copy.d.f[1] = 0;

        expect(original.c[0]).toBe(9);
        expect(original.d.f[1]).toBe(8);
    });
});
