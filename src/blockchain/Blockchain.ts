import { defaultConfig } from "../config/defaultConfig";
import { EmulationParams } from "../executor/emulatorExec";
import {Address, Cell, Message, Transaction} from "ton-core";
import {Executor, Verbosity} from "../executor/Executor";
import {SmartContract} from "../smartContract/SmartContract";

export type SendMessageOpts = {
    mutateAccounts?: boolean
    params?: EmulationParams
    processOutMessages?: boolean
};

const LT_ALIGN = 1000000n;

export class Blockchain {
    private contracts: Map<string, SmartContract>
    private networkConfig: Cell
    private lt = 0n;
    readonly executor: Executor
    readonly messageQueue: Message[] = []

    private constructor(opts: { executor: Executor, config?: Cell }) {
        this.networkConfig = opts.config ?? Cell.fromBoc(Buffer.from(defaultConfig, 'base64'))[0]
        this.contracts = new Map();
        this.executor = opts?.executor
    }

    get config(): Cell {
        return this.config
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

            this.lt += LT_ALIGN
            let transaction = await this.getContract(message.info.dest).receiveMessage(message)

            result.push(transaction)

            for (let message of transaction.outMessages.values()) {
                this.messageQueue.push(message)
            }
        }

        return result
    }

    getContract(address: Address) {
        let existing = this.contracts.get(address.toString())
        if (!existing) {
            existing = SmartContract.empty(this, address)
            this.contracts.set(address.toString(), existing)
        }

        return existing
    }

    setConfig(config: Cell) {
        this.networkConfig = config
    }

    setVerbosity(verbosity: Verbosity) {

    }

    static async create(opts?: { config?: Cell }) {
        return new Blockchain({ executor: await Executor.create(), ...opts })
    }
}