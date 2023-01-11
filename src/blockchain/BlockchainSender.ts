import { Address, Cell, Sender, SenderArguments } from "ton-core";
import { Blockchain } from "./Blockchain";

export class BlockchainSender implements Sender {
    constructor(
        private readonly blockchain: Blockchain,
        readonly address: Address,
    ) {}

    async send(args: SenderArguments) {
        this.blockchain.pushMessage({
            info: {
                type: 'internal',
                ihrDisabled: true,
                ihrFee: 0n,
                bounce: args.bounce ?? true,
                bounced: false,
                src: this.address,
                dest: args.to,
                value: { coins: args.value },
                forwardFee: 0n,
                createdAt: 0,
                createdLt: 0n,
            },
            body: args.body ?? new Cell()
        })
    }
}