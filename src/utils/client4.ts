import { Address, Cell, TonClient4 } from "ton";
import { AccountState, ShardAccount } from "./encode";
import BN from "bn.js";

export type Client4Account = Awaited<ReturnType<typeof TonClient4.prototype.getAccount>>

const decodeMaybeBoc = (boc: string | null): Cell | undefined => {
    if (boc === null) return undefined;
    return Cell.fromBoc(Buffer.from(boc, 'base64'))[0];
}

const encodeClient4AccountState = (st: Client4Account['account']['state']): AccountState => {
    switch (st.type) {
        case 'uninit':
            return { type: 'uninit' };
        case 'active':
            return {
                type: 'active',
                code: decodeMaybeBoc(st.code),
                data: decodeMaybeBoc(st.data),
            };
        case 'frozen':
            return {
                type: 'frozen',
                stateHash: Buffer.from(st.stateHash, 'base64'),
            };
    }
};

export const client4AccountToShardAccount = (acc: Client4Account, addr: Address, storageLastTransLT: BN): ShardAccount => {
    if (acc.account.last === null) throw new Error('account.last is null');
    if (acc.account.storageStat === null) throw new Error('account.storageStat is null');
    return {
        account: {
            address: addr,
            storageStat: {
                used: acc.account.storageStat.used,
                lastPaid: acc.account.storageStat.lastPaid,
                duePayment: acc.account.storageStat.duePayment === null ? undefined : new BN(acc.account.storageStat.duePayment, 10),
            },
            storage: {
                lastTransLT: storageLastTransLT,
                currencyCollection: {
                    coins: new BN(acc.account.balance.coins, 10),
                },
                accountState: encodeClient4AccountState(acc.account.state),
            },
        },
        lastTransHash: Buffer.from(acc.account.last.hash, 'base64'),
        lastTransLT: new BN(acc.account.last.lt, 10),
    };
};