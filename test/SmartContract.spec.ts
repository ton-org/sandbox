import BN from "bn.js";
import { TonClient4, Address, parseTransaction, Slice, ExternalMessage, CommonMessageInfo, CellMessage, toNano, Cell, beginCell, contractAddress, InternalMessage } from "ton";
import { SmartContract } from "../src/smartContract/SmartContract";
import { StackEntryNumber, stackNumber } from "../src/smartContract/stack";
import { encodeAPIAccountState } from "../src/utils/apiAccount";
import { compileFunc } from "@ton-community/func-js";
import { readFileSync } from "fs";

const randomAddress = (wc: number = 0) => {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
    }
    return new Address(wc, buf);
};

describe('SmartContract', () => {
    it('should handle compiled contracts', async () => {
        const compilationResult = await compileFunc({
            entryPoints: ['test.fc'],
            sources: (path: string) => readFileSync(__dirname + '/' + path).toString(),
        });

        if (compilationResult.status === 'error') throw new Error(compilationResult.message);

        const code = Cell.fromBoc(Buffer.from(compilationResult.codeBoc, 'base64'))[0];

        const data = beginCell().storeUint(0, 32).storeCoins(0).endCell();

        const initBalance = toNano('0.05');

        const smc = SmartContract.fromState({
            address: contractAddress({
                workchain: 0,
                initialCode: code,
                initialData: data,
            }),
            accountState: {
                type: 'active',
                code,
                data,
            },
            balance: initBalance,
        });

        const returnTo = randomAddress();

        const coins = toNano('1');

        const res = await smc.sendMessage(new InternalMessage({
            to: smc.getAddress(),
            from: returnTo,
            value: coins,
            bounce: true,
            body: new CommonMessageInfo({
                body: new CellMessage(
                    beginCell().storeAddress(returnTo).endCell()
                )
            })
        }));

        expect(res.transaction.outMessages.length).toBe(1);

        expect(res.transaction.outMessages[0].info.type).toBe('internal');
        if (res.transaction.outMessages[0].info.type !== 'internal') return;

        expect(res.transaction.outMessages[0].info.dest.equals(returnTo)).toBeTruthy();
        expect(res.transaction.outMessages[0].info.value.coins.eq(coins)).toBeTruthy();
        expect(smc.getAccount().storage.balance.coins.lt(initBalance)).toBeTruthy(); // contract pays for gas out of initial balance

        const info = await smc.runGetMethod('get_info');

        expect((info.stack[0] as StackEntryNumber).value.eqn(1)).toBeTruthy(); // total messages
        expect((info.stack[1] as StackEntryNumber).value.eq(coins)).toBeTruthy(); // total volume
    })

    it('should successfully execute existing transactions', async () => {
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

        expect(res.actionsCell!.hash().equals(res.transaction.description.actionPhase!.actionListHash)).toBeTruthy();

        const seqnoAfter = ((await smc.runGetMethod('seqno')).stack[0] as StackEntryNumber).value;

        expect(seqnoAfter.eq(seqnoBefore.addn(1))).toBeTruthy();
    })

    it('should be able to run get methods', async () => {
        const compilationResult = await compileFunc({
            entryPoints: ['test.fc'],
            sources: {
                'test.fc': `
                (int, int) add_and_multiply(int a, int b) method_id {
                    return (a + b, a * b);
                }

                () recv_internal() impure {
                    ;; needed for compilation
                }
                `,
            },
        });

        if (compilationResult.status === 'error') throw new Error(compilationResult.message);

        const code = Cell.fromBoc(Buffer.from(compilationResult.codeBoc, 'base64'))[0];

        const data = new Cell();

        const address = contractAddress({
            workchain: 0,
            initialCode: code,
            initialData: data,
        });

        const smc = SmartContract.fromState({
            address,
            accountState: {
                type: 'active',
                code,
                data,
            },
            balance: new BN(0),
        });

        const res = await smc.runGetMethod('add_and_multiply', [
            stackNumber(3),
            stackNumber(new BN(2)),
        ]);

        expect(res.exitCode).toBe(0);

        expect((res.stack[0] as StackEntryNumber).value.eqn(5)).toBeTruthy();
        expect((res.stack[1] as StackEntryNumber).value.eqn(6)).toBeTruthy();
    })

    it('should output debug logs', async () => {
        const compilationResult = await compileFunc({
            entryPoints: ['test.fc'],
            sources: {
                'test.fc': `
                (int) print_a() method_id {
                    ~strdump("a");
                    return 0;
                }

                () recv_internal() impure {
                    ~strdump("b");
                }
                `,
            },
        });

        if (compilationResult.status === 'error') throw new Error(compilationResult.message);

        const code = Cell.fromBoc(Buffer.from(compilationResult.codeBoc, 'base64'))[0];

        const data = new Cell();

        const address = contractAddress({
            workchain: 0,
            initialCode: code,
            initialData: data,
        });

        const smc = SmartContract.fromState({
            address,
            accountState: {
                type: 'active',
                code,
                data,
            },
            balance: new BN(0),
        });

        const getMethodRes = await smc.runGetMethod('print_a');

        expect(getMethodRes.debugLogs[0]).toBe('#DEBUG#: a');

        const res = await smc.sendMessage(new InternalMessage({
            from: randomAddress(),
            to: smc.getAddress(),
            bounce: true,
            value: toNano('0.05'),
            body: new CommonMessageInfo({
                body: new CellMessage(new Cell()),
            })
        }));

        expect(res.debugLogs[0]).toBe('#DEBUG#: b');
    })
})