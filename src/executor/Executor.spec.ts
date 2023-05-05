import {Executor} from "./Executor";
import {Address, beginCell, Cell, contractAddress, storeMessage, storeShardAccount} from "ton-core";
import {defaultConfig} from "../config/defaultConfig";

describe('Executor', () => {
    let executor: Executor
    beforeAll(async () => {
        executor = await Executor.create()
    })

    it('should run get method', () => {
        let code = Cell.fromBoc(Buffer.from('te6ccsEBAgEAEQANEQEU/wD0pBP0vPLICwEABNOgu3u26g==', 'base64'))[0];
        let data = beginCell().endCell()

        let res = executor.runGetMethod({
            verbosity: 'full_location',
            code,
            data,
            address: contractAddress(0, { code, data }),
            config: defaultConfig,
            methodId: 0,
            stack: [{ type: 'int', value: 1n }, { type: 'int', value: 2n }],
            balance: 0n,
            gasLimit: 0n,
            unixTime: 0,
            randomSeed: Buffer.alloc(32),
            debugEnabled: true,
        });
        expect(res.output.success).toBe(true)
    })

    it('should run transaction', async () => {
        let res = executor.runTransaction({
            config: defaultConfig,
            libs: null,
            verbosity: 'full_location',
            shardAccount: beginCell().store(storeShardAccount({
                account: null,
                lastTransactionHash: 0n,
                lastTransactionLt: 0n,
            })).endCell().toBoc().toString('base64'),
            message: beginCell().store(storeMessage({
                info: {
                    type: 'internal',
                    src: new Address(0, Buffer.alloc(32)),
                    dest: new Address(0, Buffer.alloc(32)),
                    value: { coins: 1000000000n },
                    bounce: false,
                    ihrDisabled: true,
                    ihrFee: 0n,
                    bounced: false,
                    forwardFee: 0n,
                    createdAt: 0,
                    createdLt: 0n,
                },
                body: new Cell(),
            })).endCell(),
            now: 0,
            lt: 0n,
            randomSeed: Buffer.alloc(32),
            ignoreChksig: false,
            debugEnabled: true,
        })
        expect(res.result.success).toBe(true)
    })
})