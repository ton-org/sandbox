import {Address, Cell} from "ton-core";
import {SmartContract} from "./SmartContract";
import {Blockchain} from "./Blockchain";
import {TonClient4} from "ton";

export interface BlockchainStorage {
    getContract(blockchain: Blockchain, address: Address): Promise<SmartContract>
}

export class LocalBlockchainStorage implements BlockchainStorage {
    private contracts: Map<string, SmartContract> = new Map()

    async getContract(blockchain: Blockchain, address: Address) {
        let existing = this.contracts.get(address.toString())
        if (!existing) {
            existing = SmartContract.empty(blockchain, address)
            this.contracts.set(address.toString(), existing)
        }

        return existing
    }
}

export class RemoteBlockchainStorage implements BlockchainStorage {
    private contracts: Map<string, SmartContract> = new Map()
    private client: TonClient4
    private blockSeqno?: number

    constructor(client: TonClient4, blockSeqno?: number) {
        this.client = client
        this.blockSeqno = blockSeqno
    }

    private async getLastBlockSeqno() {
        return this.blockSeqno ?? (await this.client.getLastBlock()).last.seqno
    }

    async getContract(blockchain: Blockchain, address: Address) {
        let existing = this.contracts.get(address.toString())
        if (!existing) {
            let blockSeqno = await this.getLastBlockSeqno()
            let account = await this.client.getAccount(blockSeqno, address)

            if (account.account.state.type !== 'active') {
                existing = SmartContract.empty(blockchain, address)
            } else {
                existing = SmartContract.create(blockchain, {
                    address: address,
                    data: Cell.fromBase64(account.account.state.data!),
                    code: Cell.fromBase64(account.account.state.code!),
                    balance: BigInt(account.account.balance.coins)
                })
            }

            this.contracts.set(address.toString(), existing)
        }

        return existing
    }
}