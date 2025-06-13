import { BlockId } from '../../executor/Executor';

export function createBlockId(seqno: number): BlockId {
    return {
        workchain: 0,
        shard: 0x8000000000000000n,
        seqno,
        rootHash: Buffer.alloc(32, seqno),
        fileHash: Buffer.alloc(32, 255 - seqno),
    };
}
