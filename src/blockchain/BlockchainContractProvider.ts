import { AccountState, Address, Cell, comment, ContractGetMethodResult, ContractProvider, ContractState, Message, Sender, SendMode, toNano, TupleItem, TupleReader } from "ton-core";
import { SendMessageResult } from "./Blockchain";
import { GetMethodResult, SmartContract } from "./SmartContract";

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
        private readonly blockchain: {
            getContract(address: Address): Promise<SmartContract>
            pushMessage(message: Message): Promise<void>
            runGetMethod(address: Address, method: string, args: TupleItem[]): Promise<GetMethodResult>
            runTickTock(address: Address, isTock: boolean) : Promise<SendMessageResult>
        },
        private readonly address: Address,
        private readonly init?: { code: Cell, data: Cell },
    ) {}

    async getState(): Promise<ContractState> {
        const contract = await this.blockchain.getContract(this.address)
        return {
            balance: contract.balance,
            last: {
                lt: contract.lastTransactionLt,
                hash: bigintToBuffer(contract.lastTransactionHash),
            },
            state: convertState(contract.accountState),
        }
    }
    async get(name: string, args: TupleItem[]): Promise<ContractGetMethodResult> {
        const result = await this.blockchain.runGetMethod(this.address, name, args)
        return {
            stack: result.stackReader,
            gasUsed: result.gasUsed,
            logs: result.vmLogs,
        }
    }
    async external(message: Cell) {
        const init = ((await this.getState()).state.type !== 'active' && this.init) ? this.init : undefined

        await this.blockchain.pushMessage({
            info: {
                type: 'external-in',
                dest: this.address,
                importFee: 0n,
            },
            init,
            body: message,
        })
    }
    async internal(via: Sender, args: { value: string | bigint; bounce?: boolean | null; sendMode?: SendMode; body?: string | Cell | null; }) {
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

    async tick_tock(isTock: boolean) {
        return await this.blockchain.runTickTock(this.address, isTock);
    }
}
