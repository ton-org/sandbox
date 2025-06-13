import { createHash } from 'node:crypto';

import { Address } from '@ton/core';

// https://github.com/ton-blockchain/ton/blob/26761a1d139402ef343081810677d2582c3eff51/crypto/block/transaction.cpp#L1338
export function prepareRandSeed(randSeed: Buffer, addr: Address): Buffer {
    const input = Buffer.alloc(64);
    randSeed.copy(input, 0, 0, 32);

    addr.hash.copy(input, 32, 0, 32);

    return createHash('sha256').update(input).digest();
}
