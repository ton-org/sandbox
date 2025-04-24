import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    DictionaryValue,
    internal,
    loadMessageRelaxed,
    MessageRelaxed,
    Sender,
    SenderArguments,
    SendMode,
    StateInit,
    storeMessageRelaxed
} from "@ton/core";

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
        extracurrency: args.extracurrency,
        init: args.init,
        body: args.body,
        bounce: args.bounce
    })
}

/**
 * @class TreasuryContract is a Wallet alternative. For additional information see {@link Blockchain#treasury}
 */
export class TreasuryContract implements Contract {
    static readonly code = Cell.fromBase64('te6cckEBBAEARQABFP8A9KQT9LzyyAsBAgEgAwIAWvLT/+1E0NP/0RK68qL0BNH4AH+OFiGAEPR4b6UgmALTB9QwAfsAkTLiAbPmWwAE0jD+omUe')

    static create(workchain: number, subwalletId: bigint) {
        return new TreasuryContract(workchain, subwalletId);
    }

    readonly address: Address;
    readonly init: StateInit;
    readonly subwalletId: bigint;

    constructor(workchain: number, subwalletId: bigint) {
        const data = beginCell()
            .storeUint(subwalletId, 256)
            .endCell();
        this.init = { code: TreasuryContract.code, data };
        this.address = contractAddress(workchain, this.init);
        this.subwalletId = subwalletId;
    }

    /**
     * Send bulk messages using one external message.
     * @param messages Messages to send
     * @param sendMode Send mode of every message
     */
    async sendMessages(provider: ContractProvider, messages: MessageRelaxed[], sendMode?: SendMode) {
        let transfer = this.createTransfer({
            sendMode: sendMode,
            messages: messages
        })
        await provider.external(transfer)
    }

    /**
     * Sends message by arguments specified.
     */
    async send(provider: ContractProvider, args: SenderArguments) {
        await this.sendMessages(provider, [senderArgsToMessageRelaxed(args)], args.sendMode ?? undefined)
    }

    /**
     * @returns Sender
     */
    getSender(provider: ContractProvider): Treasury {
        return {
            address: this.address,
            send: async (args) => {
                let transfer = this.createTransfer({
                    sendMode: args.sendMode ?? undefined,
                    messages: [senderArgsToMessageRelaxed(args)]
                });
                await provider.external(transfer);
            }
        };
    }

    /**
     * @returns wallet balance in nanoTONs
     */
    async getBalance(provider: ContractProvider): Promise<bigint> {
        return (await provider.getState()).balance
    }

    /**
     * Creates transfer cell for {@link sendMessages}.
     */
    createTransfer(args: {
        messages: MessageRelaxed[]
        sendMode?: SendMode,
    }) {
        let sendMode = SendMode.PAY_GAS_SEPARATELY;
        if (args.sendMode !== null && args.sendMode !== undefined) {
            sendMode = args.sendMode;
        }

        if (args.messages.length > 255) {
            throw new Error('Maximum number of messages is 255');
        }
        let messages = Dictionary.empty(Dictionary.Keys.Int(16), DictionaryMessageValue);
        let index = 0;
        for (let m of args.messages) {
            messages.set(index++, { sendMode, message: m });
        }

        return beginCell()
            .storeUint(this.subwalletId, 256)
            .storeDict(messages)
            .endCell();
    }
}
