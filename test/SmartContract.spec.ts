import BN from "bn.js";
import { TonClient4, Address, parseTransaction, Slice, ExternalMessage, CommonMessageInfo, CellMessage, toNano } from "ton";
import { SmartContract } from "../src/smartContract/SmartContract";
import { StackEntryNumber } from "../src/smartContract/stack";
import { encodeAPIAccountState } from "../src/utils/apiAccount";

describe('SmartContract', () => {
    it('should successfully execute existing transactions', async () => {
        const api = new TonClient4({
            endpoint: 'https://testnet-v4.tonhubapi.com'
        });

        const addr = Address.parse('EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC');

        const masterchainBlock = 4913873;

        const txLt = new BN('6150008000001', 10);
        const txHash = Buffer.from('C5EB5C8F972D6AFB38ADBE789FA35FB53D70E03B9BA38934AE49AA9D02E2BBFB', 'hex');

        const acc = await api.getAccount(masterchainBlock, addr);

        const txs = await api.getAccountTransactions(addr, txLt, txHash);

        const tx = parseTransaction(0, Slice.fromCell(txs[0].tx));

        const bal = new BN(acc.account.balance.coins, 10);

        const smc = SmartContract.fromState({
            address: addr,
            accountState: encodeAPIAccountState(acc.account.state),
            balance: bal,
        });

        const seqnoBefore = ((await smc.runGetMethod('seqno', [])).stack[0] as StackEntryNumber).value;

        const res = await smc.sendMessage(new ExternalMessage({
            to: addr,
            from: null,
            importFee: 0,
            body: new CommonMessageInfo({
                body: new CellMessage(tx.inMessage!.body),
            })
        }), {
            params: {
                unixTime: 1668781033,
            },
        });

        const outTx = res.transaction;

        expect(outTx.outMessagesCount).toBe(1);

        if (outTx.outMessages[0].info.type !== 'internal') throw new Error('tx is not internal');

        expect(outTx.outMessages[0].info.value.coins.eq(toNano('2'))).toBeTruthy();
        expect(outTx.outMessages[0].info.dest.equals(Address.parse('EQAVvjwxcZEQCbvMRz0H2PwrzAxxkv7SI3cZ2iVuB_p5SIoe'))).toBeTruthy();

        expect(res.transaction.description.type).toBe('generic');
        if (res.transaction.description.type !== 'generic') return;

        expect(res.actionsCell.hash().equals(res.transaction.description.actionPhase!.actionListHash)).toBeTruthy();

        const seqnoAfter = ((await smc.runGetMethod('seqno', [])).stack[0] as StackEntryNumber).value;

        expect(seqnoAfter.eq(seqnoBefore.addn(1))).toBeTruthy();
    })
})