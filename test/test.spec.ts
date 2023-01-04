import {compileFunc} from "@ton-community/func-js";
import {stdlib} from "./stdlib";
import {
    beginCell,
    Cell,
    CellMessage,
    CommonMessageInfo, fromNano,
    InternalMessage, parseAccount,
    parseTransaction, Slice,
    toNano
} from "ton";
import {readFileSync} from "fs";
import {buildDistributor, randomAddress} from "./distributor.data";
import {emulateTransaction, encodeShardAccount, ShardAccount, SmartContract} from "../src";
import {address} from "ton/dist/traits/trait_address";

function parseShardAccount(cs: Slice) {
    return {
        account: parseAccount(cs.readCell().beginParse()),
        lastTransHash: cs.readBuffer(32),
        lastTransLt: cs.readUint(64)
    }
}

describe('emulator', () => {
    it('should work', async () => {

        let {codeCell, dataCell} = await buildDistributor({
            owner: randomAddress(),
            processingPrice: toNano('0.1'),
            shares: [
                { address: randomAddress(), base: 2, factor: 1, comment: '1' },
                { address: randomAddress(), base: 2, factor: 1, comment: '2' },
            ],
            seed: 1
        })

        let contractAddress = randomAddress()

        let message = new InternalMessage({
            from: randomAddress(),
            to: contractAddress,
            value: toNano(10),
            body: new CommonMessageInfo({
                body: new CellMessage(beginCell().endCell())
            }),
            bounce: true,
        })

        let messageCell = beginCell().endCell()
        message.writeTo(messageCell)


        let contract = SmartContract.fromState({
            address: contractAddress,
            accountState: {
                type: 'active',
                code: codeCell,
                data: dataCell
            },
            balance: toNano('0')
        })

        contract.setVerbosity('full')

        let res = await contract.sendMessage(message)


        console.log(res.vmLogs)
        console.log(fromNano(res.shardAccount.account.storage.balance.coins))
        console.log(fromNano(res.transaction.fees.coins))
    })
})