import {Address, beginCell, beginDict, Cell} from "ton";
import {compileFunc} from "@ton-community/func-js";
import {stdlib} from "./stdlib";
import {readFileSync} from "fs";
import {pseudoRandomBytes} from "crypto";
import * as BN from "bn.js";

export function randomAddress() {
    return new Address(0, pseudoRandomBytes(256 / 8))
}

export type DistributorConfig = {
    owner: Address
    processingPrice: BN
    shares: { address: Address, factor: number, base: number, comment: string }[]
    seed: number
}

export function buildDistributorDataCell(config: DistributorConfig) {
    let shares = beginDict(32)


    let totalShares = config.shares.reduce((prev, cur) => prev + (cur.factor / cur.base), 0)

    if (totalShares !== 1) {
        throw new Error('Total shares should be 100%')
    }

    let i = 0
    for (let share of config.shares) {
        shares.storeCell(i, beginCell()
            .storeAddress(share.address)
            .storeUint(share.factor, 16)
            .storeUint(share.base, 16)
            .storeRef(beginCell().storeBuffer(Buffer.from(share.comment)).endCell())
            .endCell())
        i++
    }

    return beginCell()
        .storeAddress(config.owner)
        .storeCoins(config.processingPrice)
        .storeRef(shares.endCell())
        .storeUint(config.seed, 16)
        .endCell()
}

export async function buildDistributor(config: DistributorConfig) {
    let result = await compileFunc({
        entryPoints: ['main.fc'],
        sources: {
            "stdlib.fc": stdlib,
            "main.fc": readFileSync(__dirname + '/distributor.fc', 'utf-8'),
        }
    });

    if (result.status !== 'ok') {
        console.log(result.message)
        throw new Error()
    }

    let codeCell = Cell.fromBoc(Buffer.from(result.codeBoc, 'base64'))[0]
    let dataCell = buildDistributorDataCell(config)

    return {
        codeCell,
        dataCell
    }
}