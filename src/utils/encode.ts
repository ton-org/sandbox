import BN from "bn.js";
import { Builder, Cell, RawAccountState, RawAccountStorage, RawCurrencyCollection, RawStateInit, RawStorageInfo, RawStorageUsed, serializeDict } from "ton";
import { RawAccount, RawShardAccountNullable } from "./parse";

// simple_lib$_ public:Bool root:^Cell = SimpleLib;
// tick_tock$_ tick:Bool tock:Bool = TickTock;
// _ split_depth:(Maybe (## 5)) special:(Maybe TickTock)
//     code:(Maybe ^Cell) data:(Maybe ^Cell)
//     library:(HashmapE 256 SimpleLib) = StateInit;
export const encodeStateInit = (stateInit: RawStateInit) => {
    const b = new Builder();
    if (stateInit.splitDepth === null) {
        b.storeUint(0, 1);
    } else {
        b.storeUint(1, 1);
        b.storeUint(stateInit.splitDepth, 5);
    }
    if (stateInit.special === null) {
        b.storeUint(0, 1);
    } else {
        b.storeUint(1, 1);
        b.storeBit(stateInit.special.tick);
        b.storeBit(stateInit.special.tock);
    }
    b.storeRefMaybe(stateInit.code);
    b.storeRefMaybe(stateInit.data);
    b.storeUint(0, 1);
    return b.endCell();
};

export type AccountState = { type: 'uninit' }
    | { type: 'active', code?: Cell, data?: Cell }
    | { type: 'frozen', stateHash: Buffer }

export const accountStateToRaw = (state: AccountState): RawAccountState => {
    if (state.type !== 'active') return state;

    return {
        type: 'active',
        state: {
            splitDepth: null,
            code: state.code ?? null,
            data: state.data ?? null,
            special: null,
            raw: new Cell(),
        }
    };
};

// account_uninit$00 = AccountState;
// account_active$1 _:StateInit = AccountState;
// account_frozen$01 state_hash:bits256 = AccountState;
export const encodeAccountState = (state: RawAccountState): Cell => {
    switch (state.type) {
        case 'uninit':
            return new Builder().storeUint(0, 2).endCell();
        case 'active':
            return new Builder().storeUint(1, 1).storeCellCopy(encodeStateInit(state.state)).endCell();
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
export const encodeCurrencyCollection = (currencyCollection: RawCurrencyCollection): Cell => {
    let d: Cell | null = null;
    if (currencyCollection.extraCurrencies !== null && currencyCollection.extraCurrencies.size > 0) {
        const m = new Map<string, number>();
        for (const e of currencyCollection.extraCurrencies.entries()) {
            m.set(e[0].toString(), e[1]);
        }
        d = serializeDict(m, 32, (src, cell) => {
            cell.bits.writeVarUInt(src, 5); // 2^5 = 32
        });
    }

    return new Builder()
        .storeCoins(currencyCollection.coins)
        .storeDict(d)
        .endCell();
};

export type AccountStorage = {
    lastTransLT: BN
    currencyCollection: CurrencyCollection
    accountState: AccountState
};

export const accountStorageToRaw = (storage: AccountStorage): RawAccountStorage => {
    return {
        lastTransLt: storage.lastTransLT,
        state: accountStateToRaw(storage.accountState),
        balance: {
            coins: storage.currencyCollection.coins,
            extraCurrencies: null,
        },
    };
};

// account_storage$_ last_trans_lt:uint64
//     balance:CurrencyCollection state:AccountState 
//   = AccountStorage;
export const encodeAccountStorage = (storage: RawAccountStorage): Cell => {
    return new Builder()
        .storeUint(storage.lastTransLt, 64)
        .storeCellCopy(encodeCurrencyCollection(storage.balance))
        .storeCellCopy(encodeAccountState(storage.state))
        .endCell();
};

// storage_used$_ cells:(VarUInteger 7) bits:(VarUInteger 7) 
//   public_cells:(VarUInteger 7) = StorageUsed;
export const encodeStorageUsed = (used: RawStorageUsed): Cell => {
    return new Builder()
        .storeVarUint(used.cells, 3) // 0-6 can be stored in 3 bits
        .storeVarUint(used.bits, 3)
        .storeVarUint(used.publicCells, 3)
        .endCell();
};

// storage_info$_ used:StorageUsed last_paid:uint32
//               due_payment:(Maybe Grams) = StorageInfo;
export const encodeStorageInfo = (info: RawStorageInfo): Cell => {
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

// account_none$0 = Account;
// account$1 addr:MsgAddressInt storage_stat:StorageInfo
//           storage:AccountStorage = Account;
export const encodeAccount = (account: RawAccount | null): Cell => {
    if (account === null) {
        return new Builder()
            .storeUint(0, 1)
            .endCell();
    }

    return new Builder()
        .storeUint(1, 1)
        .storeAddress(account.address)
        .storeCellCopy(encodeStorageInfo(account.storageStat))
        .storeCellCopy(encodeAccountStorage(account.storage))
        .endCell();
};

// account_descr$_ account:^Account last_trans_hash:bits256 
//   last_trans_lt:uint64 = ShardAccount;
export const encodeShardAccount = (account: RawShardAccountNullable): Cell => {
    return new Builder()
        .storeRef(encodeAccount(account.account))
        .storeBuffer(account.lastTransHash)
        .storeUint(account.lastTransLT, 64)
        .endCell();
};