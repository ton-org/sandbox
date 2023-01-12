import { AccountStatus, Address, Cell, Transaction } from "ton-core";
import * as chai from "chai";

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
}

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
        } : {
            aborted: undefined,
            destroyed: undefined,
            exitCode: undefined,
        }),
    }
}

function compare(tx: FlatTransaction, cmp: Partial<FlatTransaction>): boolean {
    for (const key in cmp) {
        if (!(key in tx)) throw new Error(`Unknown flat transaction object key ${key}`)

        if (!compareValue((tx as any)[key], (cmp as any)[key])) return false
    }

    return true
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

function supportTransaction(Assertion: Chai.AssertionStatic) {
    Assertion.addMethod('transaction', function (this: any, cmp: Partial<FlatTransaction>) {
        const subject = this._obj
        if (Array.isArray(subject)) {
            this.assert(
                subject.map(tx => flattenTransaction(tx)).some(ftx => compare(ftx, cmp)),
                `Expected ${subject} to contain a transaction that matches pattern ${cmp}`,
                `Expected ${subject} NOT to contain a transaction that matches pattern ${cmp}, but it does`,
            )
        } else {
            this.assert(
                compare(subject, cmp),
                `Expected ${subject} to match pattern ${cmp}`,
                `Expected ${subject} NOT to match pattern ${cmp}, but it does`,
            )
        }
    })
}

chai.use((chai) => {
    supportTransaction(chai.Assertion)
})