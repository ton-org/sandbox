import { Address, Contract, ContractProvider } from "ton-core";
import { NftSaleData } from "./NftSale";

export class NftSaleV3 implements Contract {
    constructor(readonly address: Address) {}

    async getData(provider: ContractProvider): Promise<NftSaleData> {
        const { stack } = await provider.get('get_sale_data', [])
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
        ]
        return {
            marketplace,
            nft,
            nftOwner: nftOwner ?? undefined,
            price,
            marketplaceFee,
            royaltyAddress,
            royaltyAmount,
        }
    }
}