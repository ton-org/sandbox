import { AccountStatus, beginCell, Cell, SendMode, toNano } from "ton-core"
import { Blockchain, FlatTransactionComparable } from "@ton-community/tx-emulator"
import { NftCollection } from "./NftCollection"
import { NftItem } from "./NftItem"
import { NftMarketplace } from "./NftMarketplace"
import { NftSale } from "./NftSale"
import "@ton-community/jest-matchers" // register matchers

describe('Collection', () => {
    it('should work', async () => {
        const blkch = await Blockchain.create()

        const minter = await blkch.treasury('minter')
        const admin = await blkch.treasury('admin')
        const buyer = await blkch.treasury('buyer')

        const collection = blkch.openContract(new NftCollection(0, {
            owner: minter.address,
        }))
        const marketplace = blkch.openContract(new NftMarketplace(0, admin.address))

        const isDeploy: FlatTransactionComparable = {
            initCode: (x?: Cell) => x !== undefined,
            initData: (x?: Cell) => x !== undefined,
            oldStatus: (s: AccountStatus) => s !== 'active',
            endStatus: (s: AccountStatus) => s === 'active',
        }

        const itemContent = beginCell()
            .storeUint(123, 8)
            .endCell()
        const mintResult = await collection.sendMint(minter.getSender(), minter.address, {
            content: itemContent,
        })
        const collectionData = await collection.getCollectionData()
        const itemAddress = await collection.getItemAddress(collectionData.nextItemIndex - 1)
        expect(mintResult.transactions).toHaveTransaction({
            from: collection.address,
            to: itemAddress,
            ...isDeploy,
        })
        const item = blkch.openContract(new NftItem(itemAddress))
        const itemData = await item.getData()
        expect(itemData.content?.equals(itemContent)).toBeTruthy()
        expect(itemData.owner?.equals(minter.address)).toBeTruthy()

        const price = toNano('1')

        const fee = toNano('0.05')

        const sale = blkch.openContract(new NftSale(0, {
            marketplace: marketplace.address,
            nft: itemAddress,
            price,
            marketplaceFee: fee,
            royaltyAddress: collection.address,
            royaltyAmount: fee,
        }))

        const deploySaleResult = await marketplace.sendDeploy(admin.getSender(), {
            init: sale.init,
        })

        expect(deploySaleResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: sale.address,
            ...isDeploy,
        })
        expect((await blkch.getContract(sale.address)).accountState?.type).toBe('active')

        const saleDataBefore = await sale.getData()
        expect(saleDataBefore.nftOwner).toBe(undefined) // nft_owner == null (undefined in js) means that sale has not yet started
        expect(saleDataBefore.marketplace.equals(marketplace.address)).toBeTruthy()
        expect(saleDataBefore.nft.equals(itemAddress)).toBeTruthy()
        expect(saleDataBefore.royaltyAddress.equals(collection.address)).toBeTruthy()

        await item.sendTransfer(minter.getSender(), {
            to: sale.address,
            value: toNano('0.1'),
            forwardAmount: toNano('0.03'),
        })

        expect((await item.getData()).owner?.equals(sale.address)).toBeTruthy()

        const saleDataAfter = await sale.getData()
        expect(saleDataAfter.nftOwner?.equals(minter.address)).toBeTruthy()

        const buyResult = await buyer.send({
            to: sale.address,
            value: price * 2n,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
        })

        expect((await item.getData()).owner?.equals(buyer.address)).toBeTruthy()
        expect(buyResult.transactions).toHaveTransaction({
            from: sale.address,
            to: marketplace.address,
            value: fee,
        })
        expect(buyResult.transactions).toHaveTransaction({
            from: sale.address,
            to: collection.address,
            value: fee,
        })
    })
})