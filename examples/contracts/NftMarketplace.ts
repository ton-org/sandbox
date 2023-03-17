import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, storeStateInit, toNano } from "ton-core";

export type NftMarketplaceConfig = {
    owner: Address
};

function nftMarketplaceConfigToCell(config: NftMarketplaceConfig): Cell {
    return beginCell()
        .storeAddress(config.owner)
        .endCell();
}

export class NftMarketplace implements Contract {
    static readonly code = Cell.fromBase64('te6ccgEBBAEAagABFP8A9KQT9LzyyAsBAgEgAgMApNIyIccAkVvg0NMDAXGwkVvg+kAw7UTQ+kAwxwXy4ZHTHwHAAY4p+gDU1DAh+QBwyMoHy//J0Hd0gBjIywXLAljPFlAE+gITy2vMzMlx+wCRMOIABPIw')

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new NftMarketplace(address);
    }

    static createFromConfig(config: NftMarketplaceConfig, code: Cell, workchain = 0) {
        const data = nftMarketplaceConfigToCell(config);
        const init = { code, data };
        return new NftMarketplace(contractAddress(workchain, init), init);
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