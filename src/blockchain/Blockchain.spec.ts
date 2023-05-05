import {Blockchain} from "./Blockchain";
import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Message, Sender, storeTransaction, toNano} from "ton-core";
import {randomAddress} from "@ton-community/test-utils";
import {TonClient4} from "ton";
import {RemoteBlockchainStorage, wrapTonClient4ForRemote} from "./BlockchainStorage";
import {prettyLogTransactions} from "../utils/prettyLogTransaction";
import {printTransactionFees} from "../utils/printTransactionFees";
import { createShardAccount, GetMethodError, TimeError } from "./SmartContract";
import { internal } from "../utils/message";
import { BlockchainContractProvider } from "./BlockchainContractProvider";

describe('Blockchain', () => {
    jest.setTimeout(30000)

    it('should work with remote storage', async () => {
        let client = new TonClient4({
            endpoint: 'https://mainnet-v4.tonhubapi.com'
        })

        let blockchain = await Blockchain.create({
            storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(client))
        })

        let buyer = randomAddress()

        let saleContractAddress = Address.parse('EQARG1yo4fg29oCxOFM3Ua2rizUErlRw9gu0RWvIfKFtxsF0')

        let message: Message = {
            info: {
                type: 'internal',
                dest: saleContractAddress,
                src: buyer,
                value: { coins: toNano(400) },
                bounce: true,
                ihrDisabled: true,
                bounced: false,
                ihrFee: 0n,
                forwardFee: 0n,
                createdAt: 0,
                createdLt: 0n
            },
            body: beginCell().endCell()
        }

        let res = await blockchain.sendMessage(message)

        prettyLogTransactions(res.transactions)

        printTransactionFees(res.transactions)

        let nft = await blockchain.getContract(Address.parse('EQDTbyyOixs9JsO8bmHjk9WJYN8deL-qJeNZvWx147pM8qeO'))
        let data = await nft.get('get_nft_data')

        let [, , , owner] = [data.stackReader.pop(), data.stackReader.pop(), data.stackReader.pop(), data.stackReader.readAddress()]

        expect(buyer.equals(owner)).toBe(true)
    })

    it('should print debug logs', async () => {
        const blockchain = await Blockchain.create()

        const testAddress = randomAddress()

        await blockchain.setShardAccount(testAddress, createShardAccount({
            address: testAddress,
            code: Cell.fromBase64('te6ccgEBBAEAKQABFP8A9KQT9LzyyAsBAgFiAgMAEtBbAf4gMP4gMAAToHw6A/xAYfxAYQ=='),
            data: new Cell(),
            balance: toNano('1'),
        }))

        console.log('transaction')

        await blockchain.sendMessage({
            info: {
                type: 'internal',
                dest: testAddress,
                src: randomAddress(),
                value: { coins: toNano('1') },
                bounce: true,
                ihrDisabled: true,
                bounced: false,
                ihrFee: 0n,
                forwardFee: 0n,
                createdAt: 0,
                createdLt: 0n
            },
            body: beginCell().endCell()
        })

        console.log('get method')

        await blockchain.runGetMethod(testAddress, 'test_dump', [{ type: 'int', value: 3n }, { type: 'int', value: 5n }])
    })

    it('should preinitialize treasury', async () => {
        const blockchain = await Blockchain.create()

        const treasury = await blockchain.treasury('')

        expect((await blockchain.getContract(treasury.address)).accountState?.type).toBe('active')
    })

    it('should have non-empty bounce bodies', async () => {
        const blockchain = await Blockchain.create()

        const address = randomAddress()

        await blockchain.setShardAccount(address, createShardAccount({
            address,
            code: Cell.fromBase64('te6ccgEBAgEAGAABFP8A9KQT9LzyyAsBABLTXwSCAN6t8vA='),
            data: new Cell(),
            balance: toNano('1'),
        }))

        const body = beginCell()
            .storeUint(0xdeadbeef, 32)
            .endCell()

        const res = await blockchain.sendMessage(internal({
            from: new Address(0, Buffer.alloc(32)),
            to: address,
            value: toNano('1'),
            bounce: true,
            body,
        }))

        expect(res.transactions).toHaveTransaction({
            from: address,
            body: beginCell()
                .storeUint(0xffffffff, 32)
                .storeSlice(body.beginParse())
                .endCell(),
        })
    })

    it('should correctly override now', async () => {
        const blockchain = await Blockchain.create()

        const address = randomAddress()

        await blockchain.setShardAccount(address, createShardAccount({
            address,
            code: Cell.fromBase64('te6ccgEBBAEARgABFP8A9KQT9LzyyAsBAgFiAgMAVtBsMdMfMfpAMPgjghD////+cIAYyMsFUATPFiP6AhPLahLLH8sfyYBA+wAACaAsOfBH'),
            data: new Cell(),
            balance: toNano('1'),
        }))

        blockchain.now = 1

        const res1 = await blockchain.runGetMethod(address, 'get_now')
        expect(res1.stackReader.readNumber()).toBe(1)

        const sender = await blockchain.treasury('sender')

        const tx1 = await blockchain.sendMessage(internal({
            from: sender.address,
            to: address,
            value: toNano('1'),
            body: beginCell().storeUint(0, 32).storeAddress(sender.address).endCell(),
        }))

        expect(tx1.transactions).toHaveTransaction({
            from: address,
            op: 0xfffffffe,
            body: (x: Cell) => x.beginParse().skip(32).loadUint(32) === 1,
        })

        const res2 = await blockchain.runGetMethod(address, 'get_now', [], {
            now: 2,
        })
        expect(res2.stackReader.readNumber()).toBe(2)

        const tx2 = await blockchain.sendMessage(internal({
            from: sender.address,
            to: address,
            value: toNano('1'),
            body: beginCell().storeUint(0, 32).storeAddress(sender.address).endCell(),
        }), {
            now: 2,
        })

        expect(tx2.transactions).toHaveTransaction({
            from: address,
            op: 0xfffffffe,
            body: (x: Cell) => x.beginParse().skip(32).loadUint(32) === 2,
        })

        class NowTest implements Contract {
            constructor(readonly address: Address) {}

            async sendTest(provider: ContractProvider, sender: Sender, answerTo: Address) {
                await provider.internal(sender, {
                    value: toNano('1'),
                    body: beginCell().storeUint(0, 32).storeAddress(answerTo).endCell(),
                })
            }

            async getNow(provider: ContractProvider) {
                return (await provider.get('get_now', [])).stack.readNumber()
            }
        }

        const contract = blockchain.openContract(new NowTest(address))

        blockchain.now = 3

        expect(await contract.getNow()).toBe(3)

        const txc = await contract.sendTest(sender.getSender(), sender.address)

        expect(txc.transactions).toHaveTransaction({
            from: address,
            op: 0xfffffffe,
            body: (x: Cell) => x.beginParse().skip(32).loadUint(32) === 3,
        })
    })

    it('should correctly return treasury balance', async () => {
        const blockchain = await Blockchain.create()

        const treasury = await blockchain.treasury('treasury')

        expect((await blockchain.getContract(treasury.address)).balance).toBe(await treasury.getBalance())

        await treasury.send({
            to: randomAddress(),
            value: toNano('1'),
            bounce: false,
        })

        expect((await blockchain.getContract(treasury.address)).balance).toBe(await treasury.getBalance())
    })

    it('should throw on failed get methods', async () => {
        const blockchain = await Blockchain.create()

        const address = randomAddress()

        await blockchain.setShardAccount(address, createShardAccount({
            address,
            code: Cell.fromBoc(Buffer.from('b5ee9c72410104010024000114ff00f4a413f4bcf2c80b0102016203020015a0fac70401bd5be5e0e2e50006d05f0419d6b6da', 'hex'))[0],
            data: new Cell(),
            balance: toNano('1'),
        }))

        expect.assertions(1)
        try {
            await blockchain.runGetMethod(address, 'get_fail')
        } catch (e) {
            if (e instanceof GetMethodError) {
                expect(e.exitCode).toBe(0xdead)
            } else {
                throw new Error('`e` is not of type GetMethodError')
            }
        }
    })

    it('should return externals', async () => {
        const blockchain = await Blockchain.create()

        const address = randomAddress()

        await blockchain.setShardAccount(address, createShardAccount({
            address,
            code: Cell.fromBoc(Buffer.from('te6ccgEBAgEAJgABFP8A9KQT9LzyyAsBAC7TXwRwVHAAc8jLAcsBywHLYcsfyXD7AA==', 'base64'))[0],
            data: new Cell(),
            balance: toNano('1'),
        }))

        const result = await blockchain.sendMessage(internal({
            from: randomAddress(),
            to: address,
            value: toNano('1'),
        }))

        expect(result.externals.length).toBe(1)
        const ext = result.externals[0]
        expect(ext.info.src).toEqualAddress(address)
        expect(ext.body).toEqualCell(beginCell().storeUint(0, 32).endCell())
    })

    it('should throw a special exception when running a tx in the past', async () => {
        const blockchain = await Blockchain.create()

        const address = randomAddress()

        await blockchain.setShardAccount(address, createShardAccount({
            address,
            code: Cell.fromBoc(Buffer.from('te6ccgEBAgEAEgABFP8A9KQT9LzyyAsBAAbTXwQ=', 'base64'))[0],
            data: new Cell(),
            balance: toNano('1'),
        }))

        blockchain.now = 100

        await blockchain.sendMessage(internal({
            from: randomAddress(),
            to: address,
            value: toNano('1'),
        }))

        blockchain.now = 99

        expect.assertions(3)
        try {
            await blockchain.sendMessage(internal({
                from: randomAddress(),
                to: address,
                value: toNano('1'),
            }))
        } catch (e) {
            if (e instanceof TimeError) {
                expect(e.address).toEqualAddress(address)
                expect(e.previousTxTime).toBe(100)
                expect(e.currentTime).toBe(99)
            } else {
                throw new Error('`e` is not of type TimeError')
            }
        }
    })

    it('should create wallets', async () => {
        const blockchain = await Blockchain.create()

        const [wallet1, wallet2, wallet3] = await blockchain.createWallets(3)

        expect(wallet1.address).not.toEqualAddress(wallet2.address)
        expect(wallet2.address).not.toEqualAddress(wallet3.address)
        expect(wallet3.address).not.toEqualAddress(wallet1.address)

        const res1 = await wallet1.send({
            to: wallet2.address,
            value: toNano('1'),
        })

        expect(res1.transactions).toHaveTransaction({
            from: wallet1.address,
            to: wallet2.address,
            success: true,
        })

        const res2 = await wallet2.send({
            to: wallet3.address,
            value: toNano('1'),
        })

        expect(res2.transactions).toHaveTransaction({
            from: wallet2.address,
            to: wallet3.address,
            success: true,
        })

        const res3 = await wallet3.send({
            to: wallet1.address,
            value: toNano('1'),
        })

        expect(res3.transactions).toHaveTransaction({
            from: wallet3.address,
            to: wallet1.address,
            success: true,
        })
    })

    it('should work with slim config', async () => {
        const blockchain = await Blockchain.create({ config: 'slim' })

        const code = Cell.fromBase64('te6ccgEBAgEALQABFP8A9KQT9LzyyAsBADzTE18D0NMDMfpAMHCAGMjLBVjPFiH6AstqyYBA+wA=')
        const data = new Cell()

        const addr = contractAddress(-1, { code, data })

        await blockchain.setShardAccount(addr, createShardAccount({
            address: addr,
            code,
            data,
            balance: toNano('10'),
        }))

        const [sender] = await blockchain.createWallets(1)

        const res = await sender.send({
            to: addr,
            value: toNano('10'),
        })

        expect(res.transactions).toHaveTransaction({
            from: sender.address,
            to: addr,
            success: true,
        })
    })

    it('should give same transactions after restoring from snapshot', async () => {
        const blockchain = await Blockchain.create()

        blockchain.now = 1000

        let wallet1 = await blockchain.treasury('sender')

        const now = 2000

        const snapshot = blockchain.snapshot()

        blockchain.now = now

        wallet1 = await blockchain.treasury('sender')

        const wallet2 = await blockchain.treasury('receiver')

        const result1 = await wallet1.send({
            to: wallet2.address,
            value: toNano('1'),
        })

        await blockchain.loadFrom(snapshot)

        blockchain.now = now

        const wallet1New = await blockchain.treasury('sender')

        const wallet2New = await blockchain.treasury('receiver')

        const result2 = await wallet1New.send({
            to: wallet2New.address,
            value: toNano('1'),
        })

        expect(result1.transactions.length).toBe(result2.transactions.length)
        for (let i = 0; i < result1.transactions.length; i++) {
            // temporary fix for an emulator bug
            result1.transactions[i].now = now
            result2.transactions[i].now = now
            result2.transactions[i].prevTransactionHash = result1.transactions[i].prevTransactionHash

            const tx1Cell = beginCell().storeWritable(storeTransaction(result1.transactions[i])).endCell()
            const tx2Cell = beginCell().storeWritable(storeTransaction(result2.transactions[i])).endCell()
            expect(tx1Cell).toEqualCell(tx2Cell)
        }
    })

    it('Should trigger tick tock transaction', async() => {
        /*
         * Test contract code
         *
         *#include "stdlib.fc";

        () recv_internal() {
        }
        
        () run_ticktock(int is_tock) {
        	is_tock~dump();
          var msg = begin_cell()
            .store_uint(0x18, 6)
            .store_slice(my_address())
            .store_grams(0)
            .store_uint(0, 1 + 4 + 4 + 64 + 32 + 1 + 1)
            .store_uint(0, 32)
            .store_uint(0, 64);
          send_raw_message(msg.end_cell(), 3);
        }
        */
        const bc   = await Blockchain.create();
        const code = Cell.fromBase64("te6ccgEBBAEANwABFP8A9KQT9LzyyAsBAgEgAgMAAtIAP6X//38QGDgpgEAMZGWC/BRnixD9AWW1ZY/ln+S5/YBA");
        const data = beginCell().endCell();
        const testAddr = contractAddress(-1, {code, data});
        await bc.setShardAccount(testAddr, createShardAccount({
            address: testAddr,
            code,
            data,
            balance: toNano('1')
        }));

        const smc = await bc.getContract(testAddr);
        let res = await smc.runTickTock(true);
        if(res.description.type !== 'tick-tock')
            throw("Tick tock transaction expected");
        expect(res.description.isTock).toBe(true);
        res = await smc.runTickTock(false);
        if(res.description.type !== 'tick-tock')
            throw("Tick tock transaction expected");
        expect(res.description.isTock).toBe(false);
    });

    it('Should chain tick tock transaction output', async() => {
        class TestWrapper implements Contract {
            constructor(readonly address: Address) {}
            runTickTock(provider: BlockchainContractProvider, isTock: boolean) {
                return provider.tick_tock(isTock);
            }
            sendTest(provider: ContractProvider, test: number) {
            }
        };
        const bc   = await Blockchain.create();
        const code = Cell.fromBase64("te6ccgEBBAEANwABFP8A9KQT9LzyyAsBAgEgAgMAAtIAP6X//38QGDgpgEAMZGWC/BRnixD9AWW1ZY/ln+S5/YBA");
        const data = beginCell().endCell();
        const testAddr = contractAddress(-1, {code, data});
        await bc.setShardAccount(testAddr, createShardAccount({
            address: testAddr,
            code,
            data,
            balance: toNano('1')
        }));

        let res = await bc.runTickTock(testAddr, true);
        // Checking returned transaction count and order
        expect(res.transactions.length).toBe(2);
        expect(res.transactions[0].description.type).toEqual("tick-tock");
        expect(res.transactions[1].description.type).toEqual("generic");

        // Testing wrapped Contract 
        // First for tick
        const wrap = bc.openContract(new TestWrapper(testAddr));
        res  = await wrap.runTickTock(false);
        expect(res.transactions.length).toBe(2);
        let tt = res.transactions[0];
        if(tt.description.type !== "tick-tock")
            throw("Expected tick tock")
        expect(res.transactions[1].description.type).toEqual("generic");
        expect(tt.description.isTock).toBe(false);
        // Then for tock
        res  = await wrap.runTickTock(true);
        expect(res.transactions.length).toBe(2);
        tt = res.transactions[0];
        if(tt.description.type !== "tick-tock")
            throw("Expected tick tock")
        expect(res.transactions[1].description.type).toEqual("generic");
        expect(tt.description.isTock).toBe(true);

    });
    it('should send coins from treasury after snapshot restore', async () => {
        const blockchain = await Blockchain.create()

        const sender = await blockchain.treasury('sender')

        const receiver = randomAddress()

        const value = toNano('1')

        const result1 = await sender.send({
            to: receiver,
            value,
        })

        expect(result1.transactions).toHaveTransaction({
            from: sender.address,
            to: receiver,
            value,
        })

        const snapshot = blockchain.snapshot()

        // try to break treasury
        await sender.send({
            to: receiver,
            value: value * 2n,
        })

        await blockchain.loadFrom(snapshot)

        const result2 = await sender.send({
            to: receiver,
            value,
        })

        expect(result2.transactions).toHaveTransaction({
            from: sender.address,
            to: receiver,
            value,
        })
    })
})
