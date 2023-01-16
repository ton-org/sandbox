import { SendMode, toNano } from "ton-core"
import { Blockchain } from "../../src"
import { NftCollection } from "./NftCollection"
import { NftItem } from "./NftItem"
import { NftMarketplace } from "./NftMarketplace"
import { NftSale } from "./NftSale"

async function main() {
    const blkch = await Blockchain.create()

    const minter = await blkch.treasury('minter')
    const { result: minterSender } = await minter.sender(minter.address)

    const col = blkch.openContract(new NftCollection(0, {
        owner: minter.address,
    }))

    const { blockchainResult: mintResult, result: index } = await col.sendMint(minterSender, minter.address)
    const itemAddress = await col.getItemAddress(index)
    const item = blkch.openContract(new NftItem(itemAddress))

    console.log(mintResult)

    const admin = await blkch.treasury('admin')
    const { result: adminSender } = await admin.sender(admin.address)

    const marketplace = blkch.openContract(new NftMarketplace(0, admin.address))

    const price = toNano('1')

    const sale = blkch.openContract(new NftSale(0, {
        marketplace: marketplace.address,
        nft: itemAddress,
        price,
        marketplaceFee: toNano('0.05'),
        royaltyAddress: col.address,
        royaltyAmount: toNano('0.05'),
    }))

    const { blockchainResult: deploySaleResult } = await marketplace.sendDeploy(adminSender, {
        init: sale.init,
    })

    console.log(deploySaleResult)

    const { blockchainResult: transferResult } = await item.sendTransfer(minterSender, {
        to: sale.address,
        value: toNano('0.1'),
        forwardAmount: toNano('0.03'),
    })

    console.log(transferResult)

    const buyer = await blkch.treasury('buyer')

    const { blockchainResult: buyResult } = await buyer.send({
        to: sale.address,
        value: price * 2n,
        sendMode: SendMode.PAY_GAS_SEPARATLY,
    })

    console.log(buyResult)
}

main()