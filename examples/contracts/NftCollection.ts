import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    StateInit,
    toNano
} from "@ton/core";
import { NftItem } from "./NftItem";

export type NftCollectionData = {
    nextItemIndex: number
    content: Cell
    owner: Address
}

export type NftCollectionConfig = {
    owner: Address
    nextItemIndex?: number
    content?: Cell
    itemCode?: Cell
    royaltyParams?: Cell
};

function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .storeUint(config.nextItemIndex ?? 0, 64)
        .storeRef(config.content ?? beginCell().storeRef(new Cell()))
        .storeRef(config.itemCode ?? NftItem.code)
        .storeRef(config.royaltyParams ?? new Cell())
        .endCell();
}

export class NftCollection implements Contract {
    static readonly code = Cell.fromBase64('te6ccgECEwEAAf4AART/APSkE/S88sgLAQIBYgIDAgLNBAUCASANDgPr0QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmf6mpqGEEINJ6cqClAXUcUG6+CgOhBCFRlgFa4QAhkZYKoAueLEn0BCmW1CeWP5Z+A54tkwCB9gHAbKLnjgvlwyJLgAPGBEuABcYEZAmAB8YEvgsIH+XhAYHCAIBIAkKAGA1AtM/UxO78uGSUxO6AfoA1DAoEDRZ8AaOEgGkQ0PIUAXPFhPLP8zMzMntVJJfBeIApjVwA9QwjjeAQPSWb6UgjikGpCCBAPq+k/LBj96BAZMhoFMlu/L0AvoA1DAiVEsw8AYjupMCpALeBJJsIeKz5jAyUERDE8hQBc8WE8s/zMzMye1UACgB+kAwQUTIUAXPFhPLP8zMzMntVAIBIAsMAD1FrwBHAh8AV3gBjIywVYzxZQBPoCE8trEszMyXH7AIAC0AcjLP/gozxbJcCDIywET9AD0AMsAyYAAbPkAdMjLAhLKB8v/ydCACASAPEAAlvILfaiaH0gaZ/qamoYLehqGCxABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAIBIBESAC+12v2omh9IGmf6mpqGDYg6GmH6Yf9IBhAALbT0faiaH0gaZ/qamoYCi+CeAI4APgCw')

    nextItemIndex: number = 0;

    constructor(readonly address: Address, readonly init?: StateInit) {}

    static createFromAddress(address: Address) {
        return new NftCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        const collection = new NftCollection(contractAddress(workchain, init), init);
        if (config.nextItemIndex !== undefined) {
            collection.nextItemIndex = config.nextItemIndex;
        }
        return collection;
    }

    async sendMint(provider: ContractProvider, via: Sender, to: Address, params?: Partial<{
        value: bigint
        itemValue: bigint
        content: Cell
    }>) {
        const index = this.nextItemIndex++
        await provider.internal(via, {
            value: params?.value ?? toNano('0.05'),
            body: beginCell()
                .storeUint(1, 32) // op
                .storeUint(0, 64) // query id
                .storeUint(index, 64)
                .storeCoins(params?.itemValue ?? toNano('0.02'))
                .storeRef(beginCell()
                    .storeAddress(to)
                    .storeRef(params?.content ?? new Cell()))
                .endCell()
        })
        return index
    }

    async getItemAddress(provider: ContractProvider, index: number): Promise<Address> {
        const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: BigInt(index) }])
        return res.stack.readAddress()
    }

    async getCollectionData(provider: ContractProvider): Promise<NftCollectionData> {
        const { stack } = await provider.get('get_collection_data', [])
        return {
            nextItemIndex: stack.readNumber(),
            content: stack.readCell(),
            owner: stack.readAddress(),
        }
    }
}
