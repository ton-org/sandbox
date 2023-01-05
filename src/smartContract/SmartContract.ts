import {Blockchain} from "../blockchain/Blockchain";
import {
    Address,
    beginCell,
    Cell,
    contractAddress,
    Message,
    parseTuple,
    ShardAccount,
    storeMessage, storeShardAccount,
    TupleItem
} from "ton-core";
import {crc16} from "../utils/crc16";

function createShardAccount(args: { address?: Address, code: Cell, data: Cell, balance: bigint, workchain?: number }): ShardAccount {
    let wc = args.workchain ?? 0
    let address = args.address ?? contractAddress(wc, { code: args.code, data: args.data })
    let balance = args.balance ?? 0n

    return {
        account: {
            addr: address,
            storage: {
                lastTransLt: 0n,
                balance: { coins: balance },
                state: {
                    type: 'active',
                    state: {
                        code: args.code,
                        data: args.data
                    }
                }
            },
            storageStats: {
                used: {
                    cells: 0n,
                    bits: 0n,
                    publicCells: 0n
                },
                lastPaid: 0,
                duePayment: null
            }
        },
        lastTransactionLt: 0n,
        lastTransactionHash: 0n
    }
}

export class SmartContract {
    readonly address: Address;
    readonly blockchain: Blockchain
    readonly balance: bigint
    private account: ShardAccount

    constructor(shardAccount: ShardAccount, blockchain: Blockchain) {
        this.address = shardAccount.account!.addr
        this.account = shardAccount
        this.blockchain = blockchain
        this.balance = shardAccount.account?.storage.balance.coins!
    }

    static create(blockchain: Blockchain, args: { address: Address, code: Cell, data: Cell, balance: bigint }) {
        let account = createShardAccount(args)
        return new SmartContract(account, blockchain)
    }

    async receiveMessage(message: Message) {
        let messageCell = beginCell().store(storeMessage(message)).endCell()
        let shardAccount = beginCell().store(storeShardAccount(this.account)).endCell()

        let res = await this.blockchain.executor.runTransaction({
            config: this.blockchain.config,
            libs: null,
            verbosity: 'short',
            shardAccount,
            message: messageCell,
            now: Math.floor(Date.now() / 1000),
            lt: this.blockchain.lt,
            randomSeed: Buffer.alloc(32)
        })
    }

    async get(method: string | number, stack: TupleItem[] = []) {

        if (this.account.account?.storage.state.type !== 'active') {
            throw new Error('Trying to run get method on non-active contract')
        }

        let res = await this.blockchain.executor.runGetMethod({
            code: this.account.account?.storage.state.state.code!,
            data: this.account.account?.storage.state.state.data!,
            methodId: typeof method === 'string' ? crc16(method) : method,
            stack,
            config: this.blockchain.config,
            verbosity: 'full',
            libs: undefined,
            address: this.address,
            unixTime: Math.floor(Date.now() / 1000),
            balance: this.balance,
            randomSeed: Buffer.alloc(32),
            gasLimit: 10_000_000n
        })

        if (!res.output.success) {
            return res.output
        }

        return {
            success: true,
            stack: parseTuple(Cell.fromBase64(res.output.stack)),
            exitCode: res.output.vm_exit_code,
            gasUsed: res.output.gas_used,
            logs: res.output.vm_log
        }
    }

}