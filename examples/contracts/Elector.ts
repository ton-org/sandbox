import { Address, Contract, ContractProvider, StateInit } from '@ton/core';

export class Elector implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: StateInit,
    ) {}

    static createFromAddress(address: Address) {
        return new Elector(address);
    }

    async getActiveElectionId(provider: ContractProvider) {
        const { stack } = await provider.get('active_election_id', []);
        return {
            electionId: stack.readBigNumber(),
        };
    }

    async getStake(provider: ContractProvider, address: Address) {
        const { stack } = await provider.get('compute_returned_stake', [
            { type: 'int', value: BigInt('0x' + address.hash.toString('hex')) },
        ]);
        return {
            value: stack.readBigNumber(),
        };
    }
}
