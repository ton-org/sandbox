import { TonClient4 } from "ton"
import { Address, toNano, SendMode } from "ton-core"
import { Blockchain, RemoteBlockchainStorage } from "@ton-community/sandbox"
import { NftSaleV3 } from "../contracts/NftSaleV3"
import { NftItem } from "../contracts/NftItem"
import "@ton-community/test-utils" // register matchers
import { Elector } from "../contracts/Elector"

describe('RemoteStorage', () => {
    it('should pull a contract from the real network and interact with it', async () => {
        const blkch = await Blockchain.create({
            storage: new RemoteBlockchainStorage(new TonClient4({
                endpoint: 'https://mainnet-v4.tonhubapi.com',
            }))
        })

        const saleAddress = Address.parse('EQCvEM2Q7GOmQIx9WVFTF9I1AtpTa1oqZUo3Hz7wo79AZICl')
        const sale = blkch.openContract(NftSaleV3.createFromAddress(saleAddress))

        const saleData = await sale.getData()

        const buyer = await blkch.treasury('buyer')

        const buyerContract = await blkch.getContract(buyer.address)
        // by default each treasury gets 1000000 (one million) TONs, and NFT in question costs exactly that, but it's not enough to actually buy it (see below)
        buyerContract.balance = saleData.price * 100n

        await buyer.send({
            to: sale.address,
            value: saleData.price + toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        })

        const item = blkch.openContract(new NftItem(saleData.nft))
        const itemData = await item.getData()

        expect(itemData.owner?.equals(buyer.address)).toBeTruthy()
    })

    it('should pull a elector contract from the real network on a specific block and interact with it', async () => {
        const blkch = await Blockchain.create({
            storage: new RemoteBlockchainStorage(
                new TonClient4({
                    endpoint: 'https://mainnet-v4.tonhubapi.com',
                }),
                27672122,
            )
        })
        const electorAddress = Address.parse('Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF')
        const elector = blkch.openContract(Elector.createFromAddress(electorAddress))

        let { electionId } = await elector.getActiveElectionId()
        expect(electionId).toBe(0n) // Elections are currently closed

        let validator = Address.parse("Ef-uUzYrfNhd1mXpJ24F-51a6WtLY31NU03073PqXPj4vS60")
        let { value } = await elector.getStake(validator)

        expect(value).toBe(7903051587317n)
    })  
})
