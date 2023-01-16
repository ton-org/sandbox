import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, storeStateInit, toNano } from "ton-core";

export class NftMarketplace implements Contract {
    static readonly code = Cell.fromBase64('te6ccgEBBAEAagABFP8A9KQT9LzyyAsBAgEgAgMApNIyIccAkVvg0NMDAXGwkVvg+kAw7UTQ+kAwxwXy4ZHTHwHAAY4p+gDU1DAh+QBwyMoHy//J0Hd0gBjIywXLAljPFlAE+gITy2vMzMlx+wCRMOIABPIw')

    readonly address: Address;
    readonly init: { code: Cell; data: Cell; };

    constructor(workchain: number, owner: Address) {
        const data = beginCell()
            .storeAddress(owner)
            .endCell()
        this.init = { code: NftMarketplace.code, data }
        this.address = contractAddress(workchain, this.init)
    }

    async sendDeploy(provider: ContractProvider, via: Sender, params: {
        init: { code: Cell, data: Cell }
        body?: Cell
        value?: bigint
        deployValue?: bigint
    }) {
        await provider.internal(via, {
            value: params.value ?? toNano('0.1'),
            body: beginCell()
                .storeUint(1, 32) // op
                .storeCoins(params.deployValue ?? toNano('0.05'))
                .storeRef(beginCell().storeWritable(storeStateInit(params.init)))
                .storeRef(params.body ?? new Cell())
                .endCell()
        })
        return contractAddress(0, params.init)
    }
}