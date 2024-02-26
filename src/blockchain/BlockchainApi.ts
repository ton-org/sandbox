import {Address, Contract, OpenedContract, StateInit} from "@ton/core";
import {Blockchain} from "./Blockchain";

export class BlockchainApi {
  private readonly blockchain: Blockchain;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
  }

  open<T extends Contract>(contract: T): OpenedContract<T> {
    return this.blockchain.openContract(contract) as OpenedContract<T>;
  }

  provider(address: Address, init?: StateInit | null) {
    return this.blockchain.provider(address, init);
  }

}
