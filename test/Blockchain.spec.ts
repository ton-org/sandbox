import BN from "bn.js";
import { TonClient4, Address, parseTransaction, Slice, ExternalMessage, CommonMessageInfo, CellMessage } from "ton";
import { SmartContract } from "../src/smartContract/SmartContract";
import { encodeAPIAccountState } from "../src/utils/apiAccount";
import { Blockchain } from "../src/blockchain/Blockchain";

describe('Blockchain', () => {
    it('should work', async () => {
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

        const blkch = new Blockchain();

        blkch.setSmartContract(smc);

        const res = await blkch.sendMessage(new ExternalMessage({
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
        
        expect(res.outTransactions[0].result.shardAccount.account.storage.balance.coins.gtn(0)).toBeTruthy();
    })
})