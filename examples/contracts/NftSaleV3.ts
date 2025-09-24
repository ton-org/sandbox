import { Address, Cell, Contract, ContractProvider } from '@ton/core';
import { Maybe } from '@ton/ton/dist/utils/maybe';

import { NftSaleConfig } from './NftSale';

export class NftSaleV3 implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: Maybe<{ code: Cell; data: Cell }>,
    ) {}

    static createFromAddress(address: Address) {
        return new NftSaleV3(address);
    }

    async getData(provider: ContractProvider): Promise<NftSaleConfig> {
        const { stack } = await provider.get('get_sale_data', []);
        const [, , , marketplace, nft, nftOwner, price, , marketplaceFee, royaltyAddress, royaltyAmount] = [
            stack.pop(),
            stack.pop(),
            stack.pop(),
            stack.readAddress(),
            stack.readAddress(),
            stack.readAddressOpt(),
            stack.readBigNumber(),
            stack.pop(),
            stack.readBigNumber(),
            stack.readAddress(),
            stack.readBigNumber(),
        ];
        return {
            marketplace,
            nft,
            nftOwner: nftOwner ?? undefined,
            price,
            marketplaceFee,
            royaltyAddress,
            royaltyAmount,
        };
    }
}
