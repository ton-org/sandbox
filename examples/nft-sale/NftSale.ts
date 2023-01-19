import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider } from "ton-core";

export type NftSaleData = {
    marketplace: Address
    nft: Address
    nftOwner?: Address // init as null
    price: bigint
    marketplaceFee: bigint
    royaltyAddress: Address
    royaltyAmount: bigint
}

export class NftSale implements Contract {
    static readonly code = Cell.fromBase64('te6ccgECCgEAAbQAART/APSkE/S88sgLAQIBIAIDAgFIBAUABPIwAgLNBgcAL6A4WdqJofSB9IH0gfQBqGGh9AH0gfQAYQH30A6GmBgLjYSS+CcH0gGHaiaH0gfSB9IH0AahgRa6ThAVnHHZkbGymQ44LJL4NwKJFjgvlw+gFpj8EIAonGyIldeXD66Z+Y/SAYIBpkKALniygB54sA54sA/QFmZPaqcBNjgEybCBsimYI4eAJwA2mP6Z+YEOAAyS+FcBDAgB9dQQgdzWUAKShQKRhfeXDhAeh9AH0gfQAYOEAIZGWCqATniyi50JDQqFrQilAK/QEK5bVkuP2AOEAIZGWCrGeLKAP9AQtltWS4/YA4QAhkZYKoAueLAP0BCeW1ZLj9gDgQQQgv5h6KEMAMZGWCqALnixF9AQpltQnlj4pAkAyMACmjEQRxA2RUAS8ATgMjY3BMADjkeCEDuaygAVvvLhyVMSxwVZxwWx8uHKcCCCEF/MPRQhgBDIywVQBs8WIvoCFctqFMsfFMs/Ic8WAc8WygAh+gLKAMmBAKD7AOBfBoQP8vAAKss/Is8WWM8WygAh+gLKAMmBAKD7AA==')

    readonly address: Address;
    readonly init: { code: Cell; data: Cell; };

    constructor(workchain: number, params: NftSaleData) {
        const data = beginCell()
            .storeAddress(params.marketplace)
            .storeAddress(params.nft)
            .storeAddress(params.nftOwner)
            .storeCoins(params.price)
            .storeRef(beginCell()
                .storeCoins(params.marketplaceFee)
                .storeAddress(params.royaltyAddress)
                .storeCoins(params.royaltyAmount))
            .endCell()
        this.init = { code: NftSale.code, data }
        this.address = contractAddress(workchain, this.init)
    }

    async getData(provider: ContractProvider): Promise<NftSaleData> {
        const { stack } = await provider.get('get_sale_data', [])
        return {
            marketplace: stack.readAddress(),
            nft: stack.readAddress(),
            nftOwner: stack.readAddressOpt() ?? undefined,
            price: stack.readBigNumber(),
            marketplaceFee: stack.readBigNumber(),
            royaltyAddress: stack.readAddress(),
            royaltyAmount: stack.readBigNumber(),
        }
    }
}