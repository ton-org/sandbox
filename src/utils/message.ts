import { Address, Cell, Dictionary, Message, StateInit } from "@ton/core";

/**
 * Creates {@link Message} from params.
 */
export function internal(params: {
    from: Address
    to: Address
    value: bigint
    body?: Cell
    stateInit?: StateInit
    bounce?: boolean
    bounced?: boolean
    ihrDisabled?: boolean
    ihrFee?: bigint
    forwardFee?: bigint
    createdAt?: number
    createdLt?: bigint
    ec?: Dictionary<number, bigint> | [number, bigint][]
}): Message {
    let ecd: Dictionary<number, bigint> | undefined = undefined
    if (params.ec !== undefined) {
        if (Array.isArray(params.ec)) {
            ecd = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(5))
            for (const [k, v] of params.ec) {
                ecd.set(k, v)
            }
        } else {
            ecd = params.ec
        }
    }
    return {
        info: {
            type: 'internal',
            dest: params.to,
            src: params.from,
            value: { coins: params.value, other: ecd },
            bounce: params.bounce ?? true,
            ihrDisabled: params.ihrDisabled ?? true,
            bounced: params.bounced ?? false,
            ihrFee: params.ihrFee ?? 0n,
            forwardFee: params.forwardFee ?? 0n,
            createdAt: params.createdAt ?? 0,
            createdLt: params.createdLt ?? 0n,
        },
        body: params.body ?? new Cell(),
        init: params.stateInit,
    }
}
