import BN from "bn.js";
import { Address, RawStorageInfo, RawAccountStorage, Cell, Slice, parseAccount } from "ton";

export type RawShardAccountNullable = {
    account: RawAccount | null;
    lastTransHash: Buffer;
    lastTransLT: BN;
};

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

export const parseShardAccount = (sa: Cell): RawShardAccountNullable => {
    const cs = Slice.fromCell(sa);
    const acc = parseAccount(cs.readCell().beginParse());
    return {
        account: acc,
        lastTransHash: cs.readBuffer(32),
        lastTransLT: cs.readUint(64),
    };
};