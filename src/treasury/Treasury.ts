import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, DictionaryValue, internal, loadMessageRelaxed, MessageRelaxed, Sender, SenderArguments, SendMode, storeMessageRelaxed } from "ton-core";
import { KeyPair, sign } from "ton-crypto";

const DictionaryMessageValue: DictionaryValue<{ sendMode: SendMode, message: MessageRelaxed }> = {
    serialize(src, builder) {
        builder.storeUint(src.sendMode, 8);
        builder.storeRef(beginCell().store(storeMessageRelaxed(src.message)));
    },
    parse(src) {
        let sendMode = src.loadUint(8);
        let message = loadMessageRelaxed(src.loadRef().beginParse());
        return { sendMode, message };
    },
}

export type Treasury = Sender & {
    address: Address
}

function senderArgsToMessageRelaxed(args: SenderArguments): MessageRelaxed {
    return internal({
        to: args.to,
        value: args.value,
        init: args.init,
        body: args.body,
        bounce: args.bounce
    })
}

export class TreasuryContract implements Contract {
    static readonly code = Cell.fromBase64('te6ccgEBCAEAlwABFP8A9KQT9LzyyAsBAgEgAgMCAUgEBQC48oMI1xgg0x/TH9MfAvgju/Jj7UTQ0x/TH9P/0VEyuvKhUUS68qIE+QFUEFX5EPKj9ATR+AB/jhYhgBD0eG+lIJgC0wfUMAH7AJEy4gGz5lsBpMjLH8sfy//J7VQABNAwAgFIBgcAF7s5ztRNDTPzHXC/+AARuMl+1E0NcLH4')

    static create(workchain: number, keypair: KeyPair) {
        return new TreasuryContract(workchain, keypair);
    }

    readonly address: Address;
    readonly init: { code: Cell, data: Cell };
    readonly keypair: KeyPair;
    seqno: number = 0;

    constructor(workchain: number, keypair: KeyPair) {
        const data = beginCell()
            .storeUint(0, 32) // Seqno
            .storeUint(698983191, 32) // Wallet Id
            .storeBuffer(keypair.publicKey)
            .endCell();
        this.init = { code: TreasuryContract.code, data };
        this.address = contractAddress(workchain, this.init);
        this.keypair = keypair;
    }

    async sendMessages(provider: ContractProvider, messages: MessageRelaxed[], sendMode?: SendMode) {
        let transfer = this.createTransfer({
            seqno: this.seqno++,
            sendMode: sendMode,
            messages: messages
        })
        await provider.external(transfer)
    }

    async send(provider: ContractProvider, args: SenderArguments) {
        await this.sendMessages(provider, [senderArgsToMessageRelaxed(args)], args.sendMode ?? undefined)
    }

    getSender(provider: ContractProvider): Treasury {
        return {
            address: this.address,
            send: async (args) => {
                let transfer = this.createTransfer({
                    seqno: this.seqno++,
                    sendMode: args.sendMode ?? undefined,
                    messages: [senderArgsToMessageRelaxed(args)]
                });
                await provider.external(transfer);
            }
        };
    }

    async getBalance(provider: ContractProvider): Promise<bigint> {
        return (await provider.getState()).balance
    }

    /**
     * Create signed transfer
     */
    createTransfer(args: {
        seqno: number,
        messages: MessageRelaxed[]
        sendMode?: SendMode,
    }) {

        // Resolve send mode
        let sendMode = SendMode.PAY_GAS_SEPARATELY;
        if (args.sendMode !== null && args.sendMode !== undefined) {
            sendMode = args.sendMode;
        }

        // Resolve messages
        if (args.messages.length > 255) {
            throw new Error('Maximum number of messages is 255');
        }
        let messages = Dictionary.empty(Dictionary.Keys.Int(16), DictionaryMessageValue);
        let index = 0;
        for (let m of args.messages) {
            messages.set(index++, { sendMode, message: m });
        }

        // Create message
        let signingMessage = beginCell()
            .storeUint(698983191, 32) // Wallet Id
            .storeUint(4294967295, 32) // Timeout
            .storeUint(args.seqno, 32) // Seqno
            .storeDict(messages);

        // Sign message
        let signature = sign(signingMessage.endCell().hash(), this.keypair.secretKey);

        // Body
        const body = beginCell()
            .storeBuffer(signature)
            .storeBuilder(signingMessage)
            .endCell();

        return body;
    }
}