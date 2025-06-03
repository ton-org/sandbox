import { Address, ContractABI } from "@ton/core";

export type ContractMeta = {
    wrapperName?: string;
    abi?: ContractABI | null;
    treasurySeed?: string;
}

export interface ContractsMeta {
    get(key: Address): ContractMeta | undefined;
    upsert(key: Address, value: Partial<ContractMeta>): void;
}