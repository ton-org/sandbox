import { BN } from "bn.js";
import { Address, Cell, parseTransaction, Slice, toNano, TonClient4 } from "ton";
import { emulateTransaction } from "../src/emulator-exec/emulatorExec";
import { client4AccountToShardAccount } from "../src/utils/client4";
import { encodeShardAccount } from "../src/utils/encode";

describe('emulator', () => {
    it('should work', async () => {
        const api = new TonClient4({
            endpoint: 'https://testnet-v4.tonhubapi.com'
        });

        const addr = Address.parse('EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC');

        const masterchainBlock = 4913873;

        const txLt = new BN('6150008000001', 10);
        const txHash = Buffer.from('C5EB5C8F972D6AFB38ADBE789FA35FB53D70E03B9BA38934AE49AA9D02E2BBFB', 'hex');

        const lastStorageTransLt = new BN('6149729000003', 10);

        const acc = await api.getAccount(masterchainBlock, addr);

        const txs = await api.getAccountTransactions(addr, txLt, txHash);

        const tx = parseTransaction(0, Slice.fromCell(txs[0].tx));

        const msg = tx.inMessage!.raw;

        const config = await api.getConfig(masterchainBlock);

        const shardAccount = client4AccountToShardAccount(acc, addr, lastStorageTransLt);

        const res = await emulateTransaction(config.config.cell, encodeShardAccount(shardAccount), msg, {
            params: {
                unixTime: 1668781033,
            },
        });

        if (!res.result.success) throw new Error('tx was not successful');

        const outTx = parseTransaction(0, Slice.fromCell(Cell.fromBoc(Buffer.from(res.result.transaction, 'base64'))[0]));

        expect(outTx.outMessagesCount).toBe(1);

        if (outTx.outMessages[0].info.type !== 'internal') throw new Error('tx is not internal');

        expect(outTx.outMessages[0].info.value.coins.eq(toNano('2'))).toBeTruthy();
        expect(outTx.outMessages[0].info.dest.equals(Address.parse('EQAVvjwxcZEQCbvMRz0H2PwrzAxxkv7SI3cZ2iVuB_p5SIoe'))).toBeTruthy();
    })
})