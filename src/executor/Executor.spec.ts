import {Executor} from "./Executor";
import {beginCell, Cell, contractAddress} from "ton-core";
import {defaultConfig} from "../config/defaultConfig";

describe('Executor', () => {
    it('should create executor', async () => {
        let executor = await Executor.create()

        let code = Cell.fromBoc(Buffer.from('te6ccsEBAgEAEQANEQEU/wD0pBP0vPLICwEABNOgu3u26g==', 'base64'))[0];
        let data = beginCell().endCell()

        let res = await executor.runGetMethod({
            verbosity: 'full_location',
            code,
            data,
            address: contractAddress(0, { code, data }),
            config: Cell.fromBase64(defaultConfig),
            methodId: 0,
            stack: [{ type: 'int', value: 1n }, { type: 'int', value: 2n }],
            balance: 0n,
            gasLimit: 0n,
            unixTime: 0,
            randomSeed: Buffer.alloc(32)
        });
        expect(res.output.success).toBe(true)
    })
})