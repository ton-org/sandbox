import { keyPairFromSeed, sha256_sync } from "ton-crypto";

const prefix = 'TESTSEED'

export function testKey(seed: string) {
    return keyPairFromSeed(sha256_sync(prefix + seed))
}