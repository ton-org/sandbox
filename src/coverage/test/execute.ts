import {runtime} from "ton-assembly-dev-test/"
import type {Address, Contract, ContractProvider, Sender, StateInit, TupleReader} from "@ton/core"
import {Cell, contractAddress, toNano, TupleBuilder} from "@ton/core"
import {SandboxContract, TreasuryContract, Blockchain} from "../../"
import type {ContractGetMethodResult} from "@ton/core/dist/contract/ContractProvider"

export type ExtendedGetResult = ContractGetMethodResult & { vmLogs: string };

export const executeInstructions = async (
    code: runtime.Instr[],
    id: number = 0,
): Promise<[TupleReader, string]> => {
    class TestContract implements Contract {
        public readonly address: Address;
        public readonly init?: StateInit;

        public constructor(address: Address, init?: StateInit) {
            this.address = address;
            this.init = init;
        }

        public async send(
            provider: ContractProvider,
            via: Sender,
            args: { value: bigint; bounce?: boolean | null | undefined },
            body: Cell,
        ) {
            await provider.internal(via, {...args, body: body});
        }

        public async getAny(
            provider: ContractProvider,
            id: number,
        ): Promise<[TupleReader, string]> {
            const builder = new TupleBuilder();
            const res = (await provider.get(id, builder.build())) as ExtendedGetResult;
            return [res.stack, res.vmLogs];
        }
    }

    const blockchain: Blockchain = await Blockchain.create();
    blockchain.verbosity.print = false;
    blockchain.verbosity.vmLogs = "vm_logs_verbose";
    const treasure: SandboxContract<TreasuryContract> = await blockchain.treasury("treasure");

    const init: StateInit = {
        code: runtime.compileCell(code),
        data: new Cell(),
    };

    const address = contractAddress(0, init);
    const contract = new TestContract(address, init);

    const openContract = blockchain.openContract(contract);

    await openContract.send(
        treasure.getSender(),
        {
            value: toNano("10"),
        },
        new Cell(),
    );

    return openContract.getAny(id);
}
