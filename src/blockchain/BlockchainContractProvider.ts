import { AccountState, Address, Cell, comment, ContractProvider, ContractState, loadMessage, Sender, SendMode, toNano, TupleItem, TupleReader } from "ton-core";
import { Maybe } from "ton-core/dist/utils/maybe";
import { Blockchain } from "./Blockchain";

function bigintToBuffer(x: bigint, n = 32): Buffer {
    const b = Buffer.alloc(n)
    for (let i = 0; i < n; i++) {
        b[n-i-1] = Number((x >> BigInt(i * 8)) & 0xffn)
    }
    return b
}

function convertState(state: AccountState | undefined): ContractState['state'] {
    if (state === undefined) return {
        type: 'uninit'
    }

    switch (state.type) {
        case 'uninit':
            return {
                type: 'uninit'
            }
        case 'active':
            return {
                type: 'active',
                code: state.state.code?.toBoc(),
                data: state.state.data?.toBoc(),
            }
        case 'frozen':
            return {
                type: 'frozen',
                stateHash: bigintToBuffer(state.stateHash)
            }
    }
}

export class BlockchainContractProvider implements ContractProvider {
    constructor(
        private readonly blockchain: Blockchain,
        private readonly address: Address,
        private readonly init?: { code: Cell, data: Cell },
    ) {}

    private async getContract() {
        return await this.blockchain.getContract(this.address)
    }

    async getState(): Promise<ContractState> {
        const contract = await this.getContract()
        return {
            balance: contract.balance,
            last: {
                lt: contract.lastTransactionLt,
                hash: bigintToBuffer(contract.lastTransactionHash),
            },
            state: convertState(contract.accountState),
        }
    }
    async get(name: string, args: TupleItem[]): Promise<{ stack: TupleReader; }> {
        const contract = await this.getContract()
        const result = await contract.get(name, args)
        return {
            stack: result.stackReader,
        }
    }
    async external(message: Cell) {
        const init = ((await this.getState()).state.type !== 'active' && this.init) ? this.init : undefined

        this.blockchain.pushMessage({
            info: {
                type: 'external-in',
                dest: this.address,
                importFee: 0n,
            },
            init,
            body: message,
        })
    }
    async internal(via: Sender, args: { value: string | bigint; bounce?: Maybe<boolean>; sendMode?: SendMode | undefined; body?: Maybe<string | Cell>; }) {
        const init = ((await this.getState()).state.type !== 'active' && this.init) ? this.init : undefined

        const bounce = (args.bounce !== null && args.bounce !== undefined) ? args.bounce : true

        const value = typeof args.value === 'string' ? toNano(args.value) : args.value

        const body = typeof args.body === 'string' ? comment(args.body) : args.body

        await via.send({
            to: this.address,
            value,
            bounce,
            sendMode: args.sendMode,
            init,
            body,
        })
    }
}