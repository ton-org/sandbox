import {Blockchain} from "./Blockchain";
import {Address, beginCell, Cell, Contract, ContractProvider, Message, Sender, toNano} from "ton-core";
import {randomAddress} from "@ton-community/test-utils";
import {TonClient4} from "ton";
import {RemoteBlockchainStorage} from "./BlockchainStorage";
import {prettyLogTransactions} from "../utils/prettyLogTransaction";
import { createShardAccount, GetMethodError } from "./SmartContract";
import { internal } from "../utils/message";

describe('Blockchain', () => {
    jest.setTimeout(30000)

    it('should work with remote storage', async () => {
        let client = new TonClient4({
            endpoint: 'https://mainnet-v4.tonhubapi.com'
        })

        let blockchain = await Blockchain.create({
            storage: new RemoteBlockchainStorage(client)
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
})