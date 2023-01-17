import {Blockchain} from "./Blockchain";
import {
    Account,
    Address,
    beginCell,
    Cell,
    contractAddress, loadShardAccount, loadTransaction,
    Message,
    parseTuple,
    ShardAccount,
    storeMessage, storeShardAccount,
    TupleItem, TupleReader
} from "ton-core";
import {getSelectorForMethod} from "../utils/selector";

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

function createEmptyAccount(address: Address): Account {
    return {
        addr: address,
        storage: {
            lastTransLt: 0n,
            balance: { coins: 0n },
            state: { type: 'uninit' }
        },
        storageStats: {
            used: { cells: 0n, bits: 0n, publicCells: 0n },
            lastPaid: 0,
        }
    }
}

function createEmptyShardAccount(address: Address): ShardAccount {
    return {
        account: createEmptyAccount(address),
        lastTransactionLt: 0n,
        lastTransactionHash: 0n
    }
}

export type Verbosity = 'none' | 'vm_logs' | 'tx_logs' | 'full'

export class SmartContract {
    readonly address: Address;
    readonly blockchain: Blockchain
    private account: ShardAccount
    private verbosity: Verbosity = 'none'

    constructor(shardAccount: ShardAccount, blockchain: Blockchain) {
        this.address = shardAccount.account!.addr
        this.account = shardAccount
        this.blockchain = blockchain
    }

    get balance() {
        return this.account.account?.storage.balance.coins ?? 0n
    }

    set balance(v: bigint) {
        if (!this.account.account) {
            this.account.account = createEmptyAccount(this.address)
        }
        this.account.account.storage.balance.coins = v
    }

    get lastTransactionHash() {
        return this.account.lastTransactionHash
    }

    get lastTransactionLt() {
        return this.account.lastTransactionLt
    }

    get accountState() {
        return this.account.account?.storage.state
    }

    static create(blockchain: Blockchain, args: { address: Address, code: Cell, data: Cell, balance: bigint }) {
        let account = createShardAccount(args)
        return new SmartContract(account, blockchain)
    }

    static empty(blockchain: Blockchain, address: Address) {
        return new SmartContract(createEmptyShardAccount(address), blockchain)
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

        if (!res.result.success) {
            console.error('Error:', res.result.error, 'VM logs', res.result.vmResults)
            throw new Error('Error executing transaction')
        }
        let account = loadShardAccount(Cell.fromBase64(res.result.shardAccount).beginParse())
        this.account = account

        if (this.verbosity !== 'none') {
            console.log(res.logs)
            console.log(res.result.vmLog)
        }

        return loadTransaction(Cell.fromBase64(res.result.transaction).beginParse())
    }

    async get(method: string | number, stack: TupleItem[] = []) {
        if (this.account.account?.storage.state.type !== 'active') {
            throw new Error('Trying to run get method on non-active contract')
        }

        let res = await this.blockchain.executor.runGetMethod({
            code: this.account.account?.storage.state.state.code!,
            data: this.account.account?.storage.state.state.data!,
            methodId: typeof method === 'string' ? getSelectorForMethod(method) : method,
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
            throw new Error('Error invoking get method: ' + res.output.error)
        }

        if (this.verbosity === 'vm_logs' || this.verbosity === 'full') {
            console.log(res.logs)
        }

        let resStack = parseTuple(Cell.fromBase64(res.output.stack))

        return {
            stack: resStack,
            stackReader: new TupleReader(resStack),
            exitCode: res.output.vm_exit_code,
            gasUsed: res.output.gas_used,
            logs: res.output.vm_log
        }
    }

    setVerbosity(verbosity: Verbosity) {
        this.verbosity = verbosity
    }
}