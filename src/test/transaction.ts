import { AccountStatus, Address, Cell, Transaction } from "ton-core";

export type FlatTransaction = {
    from?: Address
    to: Address
    value?: bigint
    body: Cell
    initData?: Cell
    initCode?: Cell
    lt: bigint
    now: number
    outMessagesCount: number
    oldStatus: AccountStatus
    endStatus: AccountStatus
    totalFees?: bigint
    aborted?: boolean
    destroyed?: boolean
    exitCode?: number
    success?: boolean
}

type WithFunctions<T> = {
    [K in keyof T]: T[K] | ((x: T[K]) => boolean)
}

export type FlatTransactionComparable = Partial<WithFunctions<FlatTransaction>>

function flattenTransaction(tx: Transaction): FlatTransaction {
    return {
        from: tx.inMessage!.info.src instanceof Address ? tx.inMessage!.info.src : undefined,
        to: tx.inMessage!.info.dest as Address,
        value: tx.inMessage!.info.type === 'internal' ? tx.inMessage!.info.value.coins : undefined,
        body: tx.inMessage!.body,
        initData: tx.inMessage!.init?.data ?? undefined,
        initCode: tx.inMessage!.init?.code ?? undefined,
        lt: tx.lt,
        now: tx.now,
        outMessagesCount: tx.outMessagesCount,
        oldStatus: tx.oldStatus,
        endStatus: tx.endStatus,
        totalFees: tx.totalFees.coins,
        ...(tx.description.type === 'generic' ? {
            aborted: tx.description.aborted,
            destroyed: tx.description.destroyed,
            exitCode: tx.description.computePhase.type === 'vm' ? tx.description.computePhase.exitCode : undefined,
            success: tx.description.computePhase.type === 'vm'
                ? (tx.description.computePhase.success && tx.description.actionPhase?.success)
                : false,
        } : {
            aborted: undefined,
            destroyed: undefined,
            exitCode: undefined,
            success: undefined,
        }),
    }
}

function compareValue(a: any, b: any) {
    if (a instanceof Address) {
        if (!(b instanceof Address)) return false
        return a.equals(b)
    }

    if (a instanceof Cell) {
        if (!(b instanceof Cell)) return false
        return a.equals(b)
    }

    return a === b
}

export function compareTransaction(tx: FlatTransaction, cmp: FlatTransactionComparable): boolean {
    for (const key in cmp) {
        if (!(key in tx)) throw new Error(`Unknown flat transaction object key ${key}`)

        const cmpv = (cmp as any)[key]
        const txv = (tx as any)[key]
        if (typeof cmpv === 'function') {
            if (!cmpv(txv)) return false
        } else {
            if (!compareValue(txv, cmpv)) return false
        }
    }

    return true
}

export function compareTransactionForTest(subject: any, cmp: FlatTransactionComparable): {
    pass: boolean
    posMessage: string
    negMessage: string
} {
    if (Array.isArray(subject)) {
        return {
            pass: subject.map(tx => flattenTransaction(tx)).some(ftx => compareTransaction(ftx, cmp)),
            posMessage: `Expected ${subject} to contain a transaction that matches pattern ${cmp}`,
            negMessage: `Expected ${subject} NOT to contain a transaction that matches pattern ${cmp}, but it does`,
        }
    } else {
        return {
            pass: compareTransaction(subject, cmp),
            posMessage: `Expected ${subject} to match pattern ${cmp}`,
            negMessage: `Expected ${subject} NOT to match pattern ${cmp}, but it does`,
        }
    }
}