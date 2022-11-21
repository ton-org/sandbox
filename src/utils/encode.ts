import { Address, Builder, Cell, StateInit } from "ton";
import BN from "bn.js";

export type AccountState = { type: 'uninit' }
    | { type: 'active', code?: Cell, data?: Cell }
    | { type: 'frozen', stateHash: Buffer }

// account_uninit$00 = AccountState;
// account_active$1 _:StateInit = AccountState;
// account_frozen$01 state_hash:bits256 = AccountState;
export const encodeAccountState = (state: AccountState): Cell => {
    switch (state.type) {
        case 'uninit':
            return new Builder().storeUint(0, 2).endCell();
        case 'active':
            const stateInit = new StateInit({
                code: state.code,
                data: state.data,
            });
            const c = new Builder().storeUint(1, 1).endCell();
            stateInit.writeTo(c);
            return c;
        case 'frozen':
            return new Builder().storeUint(1, 2).storeBuffer(state.stateHash).endCell();
    }
};

export type CurrencyCollection = {
    coins: BN
};

// extra_currencies$_ dict:(HashmapE 32 (VarUInteger 32)) 
//                  = ExtraCurrencyCollection;
// currencies$_ grams:Grams other:ExtraCurrencyCollection 
//            = CurrencyCollection;
export const encodeCurrencyCollection = (currencyCollection: CurrencyCollection): Cell => {
    return new Builder()
        .storeCoins(currencyCollection.coins)
        .storeUint(0, 1)
        .endCell();
};

export type AccountStorage = {
    lastTransLT: BN
    currencyCollection: CurrencyCollection
    accountState: AccountState
};

// account_storage$_ last_trans_lt:uint64
//     balance:CurrencyCollection state:AccountState 
//   = AccountStorage;
export const encodeAccountStorage = (storage: AccountStorage): Cell => {
    return new Builder()
        .storeUint(storage.lastTransLT, 64)
        .storeCellCopy(encodeCurrencyCollection(storage.currencyCollection))
        .storeCellCopy(encodeAccountState(storage.accountState))
        .endCell();
};

export type StorageUsed = {
    cells: number
    bits: number
    publicCells: number
};

// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7) 
//   public_cells:(VarUInteger 7) = StorageUsed;
export const encodeStorageUsed = (used: StorageUsed): Cell => {
    return new Builder()
        .storeVarUint(used.cells, 3) // 0-6 can be stored in 3 bits
        .storeVarUint(used.bits, 3)
        .storeVarUint(used.publicCells, 3)
        .endCell();
};

export type StorageInfo = {
    used: StorageUsed
    lastPaid: number
    duePayment?: BN
};

// storage_info$_ used:StorageUsed last_paid:uint32
//               due_payment:(Maybe Grams) = StorageInfo;
export const encodeStorageInfo = (info: StorageInfo): Cell => {
    const c = new Builder()
        .storeCellCopy(encodeStorageUsed(info.used))
        .storeUint(info.lastPaid, 32)
        .endCell();

    if (!info.duePayment) {
        c.bits.writeUint(0, 1);
    } else {
        c.bits.writeUint(1, 1);
        c.bits.writeCoins(info.duePayment);
    }

    return c;
};

export type Account = {
    address: Address
    storageStat: StorageInfo
    storage: AccountStorage
};

// account_none$0 = Account;
// account$1 addr:MsgAddressInt storage_stat:StorageInfo
//           storage:AccountStorage = Account;
export const encodeAccount = (account: Account): Cell => {
    return new Builder()
        .storeUint(1, 1)
        .storeAddress(account.address)
        .storeCellCopy(encodeStorageInfo(account.storageStat))
        .storeCellCopy(encodeAccountStorage(account.storage))
        .endCell();
};

export type ShardAccount = {
    account: Account
    lastTransHash: Buffer
    lastTransLT: BN
};

// account_descr$_ account:^Account last_trans_hash:bits256 
//   last_trans_lt:uint64 = ShardAccount;
export const encodeShardAccount = (account: ShardAccount): Cell => {
    return new Builder()
        .storeRef(encodeAccount(account.account))
        .storeBuffer(account.lastTransHash)
        .storeUint(account.lastTransLT, 64)
        .endCell();
};