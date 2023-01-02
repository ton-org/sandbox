import BN from "bn.js";
import { TonClient4, Address, parseTransaction, Slice, ExternalMessage, CommonMessageInfo, CellMessage, beginCell, Cell, contractAddress, InternalMessage, toNano, GasLimitsPrices } from "ton";
import { encodeAPIAccountState } from "../src/utils/apiAccount";
import { Blockchain } from "../src/blockchain/Blockchain";
import { compileFunc } from "@ton-community/func-js";
import { readFileSync } from "fs";
import { randomAddress } from "./utils";

describe('Blockchain', () => {
    it('should work', async () => {
        const api = new TonClient4({
            endpoint: 'https://testnet-v4.tonhubapi.com'
        });

        const addr = Address.parse('EQBYivdc0GAk-nnczaMnYNuSjpeXu2nJS3DZ4KqLjosX5sVC');

        const masterchainBlock = 4913873;

        const txLt = new BN('6150008000001', 10);
        const txHash = Buffer.from('C5EB5C8F972D6AFB38ADBE789FA35FB53D70E03B9BA38934AE49AA9D02E2BBFB', 'hex');

        let acc: Awaited<ReturnType<TonClient4['getAccount']>>;
        let txs: Awaited<ReturnType<TonClient4['getAccountTransactions']>>;
        try {
            acc = await api.getAccount(masterchainBlock, addr);
            txs = await api.getAccountTransactions(addr, txLt, txHash);
        } catch (e) {
            console.log('skipping api test due to api error:', (e as any).message);
            return;
        }

        const tx = parseTransaction(0, Slice.fromCell(txs[0].tx));

        const bal = new BN(acc.account.balance.coins, 10);

        const blkch = new Blockchain();

        blkch.setSmartContractState(addr, encodeAPIAccountState(acc.account.state), bal);

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
        
        expect(blkch.getAccount(res.outTransactions[0].smartContract).storage.balance.coins.gtn(0)).toBeTruthy();
    })

    it('should handle compiled contracts', async () => {
        const compilationResult = await compileFunc({
            entryPoints: ['test.fc'],
            sources: (path: string) => readFileSync(__dirname + '/' + path).toString(),
        });

        if (compilationResult.status === 'error') throw new Error(compilationResult.message);

        const code = Cell.fromBoc(Buffer.from(compilationResult.codeBoc, 'base64'))[0];

        const data = beginCell().storeUint(0, 32).storeCoins(0).endCell();

        const initBalance = toNano('0.05');

        const blkch = new Blockchain();

        const addr = contractAddress({
            workchain: 0,
            initialCode: code,
            initialData: data,
        });

        blkch.setSmartContractState(addr, {
            type: 'active',
            code,
            data,
        }, initBalance);

        const returnTo = randomAddress();

        const coins = toNano('1');

        const res = await blkch.sendMessage(new InternalMessage({
            to: addr,
            from: returnTo,
            value: coins,
            bounce: true,
            body: new CommonMessageInfo({
                body: new CellMessage(
                    beginCell().storeAddress(returnTo).endCell()
                )
            })
        }));

        expect(blkch.getAccount(res.outTransactions[0].smartContract).storage.balance.coins.eq(coins)).toBeTruthy();
        expect(res.outTransactions[0].smartContract.equals(returnTo)).toBeTruthy();
    })

    it('should get and set config gas limits', async () => {
        const blkch = new Blockchain();

        const initialGasLimits = blkch.getConfigGasPrices();

        const setGasLimits: GasLimitsPrices = {
            ...initialGasLimits,
            flatLimit: initialGasLimits.flatLimit.subn(1),
        };

        blkch.setConfigGasPrices(setGasLimits);

        const newGasLimits = blkch.getConfigGasPrices();

        expect(newGasLimits.flatLimit.addn(1).eq(initialGasLimits.flatLimit)).toBeTruthy();
    })
})