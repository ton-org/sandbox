import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, toNano } from "ton-core";
import { itemCode } from "./NftItem";

const collectionCode = 'te6ccgECEwEAAf4AART/APSkE/S88sgLAQIBYgIDAgLNBAUCASANDgPr0QY4BIrfAA6GmBgLjYSK3wfSAYAOmP6Z/2omh9IGmf6mpqGEEINJ6cqClAXUcUG6+CgOhBCFRlgFa4QAhkZYKoAueLEn0BCmW1CeWP5Z+A54tkwCB9gHAbKLnjgvlwyJLgAPGBEuABcYEZAmAB8YEvgsIH+XhAYHCAIBIAkKAGA1AtM/UxO78uGSUxO6AfoA1DAoEDRZ8AaOEgGkQ0PIUAXPFhPLP8zMzMntVJJfBeIApjVwA9QwjjeAQPSWb6UgjikGpCCBAPq+k/LBj96BAZMhoFMlu/L0AvoA1DAiVEsw8AYjupMCpALeBJJsIeKz5jAyUERDE8hQBc8WE8s/zMzMye1UACgB+kAwQUTIUAXPFhPLP8zMzMntVAIBIAsMAD1FrwBHAh8AV3gBjIywVYzxZQBPoCE8trEszMyXH7AIAC0AcjLP/gozxbJcCDIywET9AD0AMsAyYAAbPkAdMjLAhLKB8v/ydCACASAPEAAlvILfaiaH0gaZ/qamoYLehqGCxABDuLXTHtRND6QNM/1NTUMBAkXwTQ1DHUMNBxyMsHAc8WzMmAIBIBESAC+12v2omh9IGmf6mpqGDYg6GmH6Yf9IBhAALbT0faiaH0gaZ/qamoYCi+CeAI4APgCw'

export class NftCollection implements Contract {
    readonly address: Address;
    readonly init: { code: Cell; data: Cell; };
    nextItemIndex: number;

    constructor(workchain: number, initParams: {
        owner: Address
        nextItemIndex?: number
        content?: Cell
        itemCode?: Cell
        royaltyParams?: Cell
    }) {
        const code = Cell.fromBase64(collectionCode)
        this.nextItemIndex = initParams.nextItemIndex ?? 0
        const data = beginCell()
            .storeAddress(initParams.owner)
            .storeUint(this.nextItemIndex, 64)
            .storeRef(initParams.content ?? new Cell())
            .storeRef(initParams.itemCode ?? Cell.fromBase64(itemCode))
            .storeRef(initParams.royaltyParams ?? new Cell())
            .endCell()
        this.init = { code, data }
        this.address = contractAddress(workchain, this.init)
    }

    async sendMint(provider: ContractProvider, via: Sender, to: Address, params?: Partial<{
        value: bigint
        itemValue: bigint
        content: Cell
    }>) {
        const idx = this.nextItemIndex++
        await provider.internal(via, {
            value: params?.value ?? toNano('0.05'),
            body: beginCell()
                .storeUint(1, 32) // op
                .storeUint(0, 64) // query id
                .storeUint(idx, 64)
                .storeCoins(params?.itemValue ?? toNano('0.02'))
                .storeRef(beginCell()
                    .storeAddress(to)
                    .storeRef(params?.content ?? new Cell()))
                .endCell()
        })
        return idx
    }

    async getItemAddress(provider: ContractProvider, index: number): Promise<Address> {
        const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: BigInt(index) }])
        return res.stack.readAddress()
    }
}