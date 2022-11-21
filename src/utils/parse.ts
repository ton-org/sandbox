import BN from "bn.js";
import { Address, RawStorageInfo, RawAccountStorage, Cell, Slice, parseAccount } from "ton";

export type RawShardAccount = {
    account: RawAccount;
    lastTransHash: Buffer;
    lastTransLT: BN;
};

export type RawAccount = {
    address: Address;
    storageStat: RawStorageInfo;
    storage: RawAccountStorage;
};

export const parseShardAccount = (sa: Cell): RawShardAccount => {
    const cs = Slice.fromCell(sa);
    const acc = parseAccount(cs.readCell().beginParse());
    if (acc === null) throw new Error('ShardAccount.Account is null');
    return {
        account: acc,
        lastTransHash: cs.readBuffer(32),
        lastTransLT: cs.readUint(64),
    };
};