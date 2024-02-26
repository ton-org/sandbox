import {
    AccountState, Address, Cell, comment, Contract,
    ContractGetMethodResult,
    ContractProvider,
    ContractState,
    Message, openContract,
    OpenedContract,
    Sender,
    SendMode, StateInit,
    toNano,
    Transaction,
    TupleItem
} from "@ton/core";
import {TickOrTock} from "../executor/Executor";
import {GetMethodResult, SmartContract} from "./SmartContract";

function bigintToBuffer(x: bigint, n = 32): Buffer {
    const b = Buffer.alloc(n)
    for (let i = 0; i < n; i++) {
        b[n - i - 1] = Number((x >> BigInt(i * 8)) & 0xffn)
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

export interface SandboxContractProvider extends ContractProvider {
    tickTock(which: TickOrTock): Promise<void>
}

export class BlockchainContractProvider implements SandboxContractProvider {
    constructor(
      private readonly blockchain: {
          getContract(address: Address): Promise<SmartContract>
          pushMessage(message: Message): Promise<void>
          runGetMethod(address: Address, method: string, args: TupleItem[]): Promise<GetMethodResult>
          pushTickTock(on: Address, which: TickOrTock): Promise<void>,
          openContract<T extends Contract>(contract: T): OpenedContract<T>
      },
      private readonly address: Address,
      private readonly init?: StateInit | null,
    ) {
    }
    open<T extends Contract>(contract: T): OpenedContract<T> {
        return this.blockchain.openContract(contract);
    }
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
        const ret = {
            ...result,
            stack: result.stackReader,
            stackItems: result.stack,
            logs: result.vmLogs,
        }
        delete (ret as any).stackReader
        return ret
    }
    getTransactions(address: Address, lt: bigint, hash: Buffer, limit?: number | undefined): Promise<Transaction[]> {
        throw new Error("`getTransactions` is not implemented in `BlockchainContractProvider`, do not use it in the tests")
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
    async tickTock(which: TickOrTock) {
        await this.blockchain.pushTickTock(this.address, which)
    }
}
