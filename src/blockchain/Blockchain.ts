import { defaultConfig } from "../config/defaultConfig";
import { EmulationParams } from "../executor/emulatorExec";
import {Address, Cell, Message, Transaction} from "ton-core";
import {Executor, Verbosity} from "../executor/Executor";
import {BlockchainStorage, LocalBlockchainStorage} from "./BlockchainStorage";

export type SendMessageOpts = {
    mutateAccounts?: boolean
    params?: EmulationParams
    processOutMessages?: boolean
};

const LT_ALIGN = 1000000n;

export class Blockchain {
    storage: BlockchainStorage
    private networkConfig: Cell
    #lt = 0n;
    readonly executor: Executor
    readonly messageQueue: Message[] = []

    get lt() {
        return this.#lt
    }

    private constructor(opts: { executor: Executor, config?: Cell, storage: BlockchainStorage }) {
        this.networkConfig = opts.config ?? Cell.fromBoc(Buffer.from(defaultConfig, 'base64'))[0]
        this.executor = opts?.executor
        this.storage = opts.storage
    }

    get config(): Cell {
        return this.networkConfig
    }

    async sendMessage(message: Message) {
        if (message.info.type === 'external-out') {
            throw new Error('Cant send external out message')
        }
        this.messageQueue.push(message)
        return await this.processQueue()
    }

    async processQueue() {
        let result: Transaction[] = []

        while (this.messageQueue.length > 0) {
            let message = this.messageQueue.shift()!

            if (message.info.type === 'external-out') {
                continue
            }

            this.#lt += LT_ALIGN
            let transaction = await (await this.getContract(message.info.dest)).receiveMessage(message)

            result.push(transaction)

            for (let message of transaction.outMessages.values()) {
                this.messageQueue.push(message)
            }
        }

        return result
    }

    async getContract(address: Address) {
        return await this.storage.getContract(this, address)
    }

    setConfig(config: Cell) {
        this.networkConfig = config
    }

    setVerbosity(verbosity: Verbosity) {

    }

    static async create(opts?: { config?: Cell, storage: BlockchainStorage }) {
        return new Blockchain({
            executor: await Executor.create(),
            storage: opts?.storage ?? new LocalBlockchainStorage(),
            ...opts
        })
    }
}