import { beginCell, SendMode, toNano } from '@ton/core';
import { Blockchain } from '@ton/sandbox';

import { NftCollection } from '../contracts/NftCollection';
import { NftItem } from '../contracts/NftItem';
import { NftMarketplace } from '../contracts/NftMarketplace';
import { NftSale } from '../contracts/NftSale';
import '@ton/test-utils'; // register matchers

describe('Collection', () => {
    it('should work', async () => {
        const blkch = await Blockchain.create();

        const minter = await blkch.treasury('minter');
        const admin = await blkch.treasury('admin');
        const buyer = await blkch.treasury('buyer');

        const collection = blkch.openContract(
            NftCollection.createFromConfig(
                {
                    owner: minter.address,
                },
                NftCollection.code,
            ),
        );
        const marketplace = blkch.openContract(
            NftMarketplace.createFromConfig(
                {
                    owner: admin.address,
                },
                NftMarketplace.code,
            ),
        );

        const itemContent = beginCell().storeUint(123, 8).endCell();
        const mintResult = await collection.sendMint(minter.getSender(), minter.address, {
            content: itemContent,
        });
        const collectionData = await collection.getCollectionData();
        const itemAddress = await collection.getItemAddress(collectionData.nextItemIndex - 1);
        expect(mintResult.transactions).toHaveTransaction({
            from: collection.address,
            to: itemAddress,
            deploy: true,
        });
        const item = blkch.openContract(NftItem.createFromAddress(itemAddress));
        const itemData = await item.getData();
        expect(itemData.content?.equals(itemContent)).toBeTruthy();
        expect(itemData.owner?.equals(minter.address)).toBeTruthy();

        const price = toNano('1');

        const fee = toNano('0.05');

        const sale = blkch.openContract(
            NftSale.createFromConfig(
                {
                    marketplace: marketplace.address,
                    nft: itemAddress,
                    price,
                    marketplaceFee: fee,
                    royaltyAddress: collection.address,
                    royaltyAmount: fee,
                },
                NftSale.code,
            ),
        );

        const deploySaleResult = await marketplace.sendDeploy(admin.getSender(), {
            init: sale.init!,
        });

        expect(deploySaleResult.transactions).toHaveTransaction({
            from: marketplace.address,
            to: sale.address,
            deploy: true,
        });

        const saleDataBefore = await sale.getData();
        expect(saleDataBefore.nftOwner).toBe(undefined); // nft_owner == null (undefined in js) means that sale has not yet started
        expect(saleDataBefore.marketplace.equals(marketplace.address)).toBeTruthy();
        expect(saleDataBefore.nft.equals(itemAddress)).toBeTruthy();
        expect(saleDataBefore.royaltyAddress.equals(collection.address)).toBeTruthy();

        await item.sendTransfer(minter.getSender(), {
            to: sale.address,
            value: toNano('0.1'),
            forwardAmount: toNano('0.03'),
        });

        expect((await item.getData()).owner?.equals(sale.address)).toBeTruthy();

        const saleDataAfter = await sale.getData();
        expect(saleDataAfter.nftOwner?.equals(minter.address)).toBeTruthy();

        const buyResult = await buyer.send({
            to: sale.address,
            value: price + toNano('1'),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        expect((await item.getData()).owner?.equals(buyer.address)).toBeTruthy();
        expect(buyResult.transactions).toHaveTransaction({
            from: sale.address,
            to: marketplace.address,
            value: fee,
        });
        expect(buyResult.transactions).toHaveTransaction({
            from: sale.address,
            to: collection.address,
            value: fee,
        });
    });
});
