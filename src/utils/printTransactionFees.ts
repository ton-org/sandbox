import { Transaction } from '@ton/core';

const decimalCount = 9;
const decimal = pow10(decimalCount);

function pow10(n: number): bigint {
    let v = 1n;
    for (let i = 0; i < n; i++) {
        v *= 10n;
    }
    return v;
}

export function formatCoinsPure(value: bigint, precision = 6): string {
    let whole = value / decimal;

    let frac = value % decimal;
    const precisionDecimal = pow10(decimalCount - precision);
    if (frac % precisionDecimal > 0n) {
        // round up
        frac += precisionDecimal;
        if (frac >= decimal) {
            frac -= decimal;
            whole += 1n;
        }
    }
    frac /= precisionDecimal;

    return `${whole.toString()}${frac !== 0n ? '.' + frac.toString().padStart(precision, '0').replace(/0+$/, '') : ''}`;
}

function formatCoins(value: bigint | undefined, precision = 6): string {
    if (value === undefined) return 'N/A';

    return formatCoinsPure(value, precision) + ' TON';
}

export type OpMapFunc = (op: number) => string | null | undefined;

/**
 * Prints transaction fees.
 *
 * @example Output
 * ```
 * ┌─────────┬─────────────┬────────────────┬────────────────┬────────────────┬────────────────┬───────────────┬────────────┬────────────────┬──────────┬────────────┐
 * │ (index) │ op          │ valueIn        │ valueOut       │ totalFees      │ inForwardFee   │ outForwardFee │ outActions │ computeFee     │ exitCode │ actionCode │
 * ├─────────┼─────────────┼────────────────┼────────────────┼────────────────┼────────────────┼───────────────┼────────────┼────────────────┼──────────┼────────────┤
 * │ 0       │ 'N/A'       │ 'N/A'          │ '1000 TON'     │ '0.004007 TON' │ 'N/A'          │ '0.001 TON'   │ 1          │ '0.001937 TON' │ 0        │ 0          │
 * │ 1       │ '45ab564' │ '1000 TON'     │ '998.8485 TON' │ '1.051473 TON' │ '0.000667 TON' │ '0.255 TON'   │ 255        │ '0.966474 TON' │ 0        │ 0          │
 * │ 2       │ '0'       │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
 * ```
 *
 * @example With mapping
 * ```
 * ┌─────────┬─────────────┬────────────────┬────────────────┬────────────────┬────────────────┬───────────────┬────────────┬────────────────┬──────────┬────────────┐
 * │ (index) │ op          │ valueIn        │ valueOut       │ totalFees      │ inForwardFee   │ outForwardFee │ outActions │ computeFee     │ exitCode │ actionCode │
 * ├─────────┼─────────────┼────────────────┼────────────────┼────────────────┼────────────────┼───────────────┼────────────┼────────────────┼──────────┼────────────┤
 * │ 0       │ 'N/A'       │ 'N/A'          │ '1000 TON'     │ '0.004007 TON' │ 'N/A'          │ '0.001 TON'   │ 1          │ '0.001937 TON' │ 0        │ 0          │
 * │ 1       │ 'Action1'   │ '1000 TON'     │ '998.8485 TON' │ '1.051473 TON' │ '0.000667 TON' │ '0.255 TON'   │ 255        │ '0.966474 TON' │ 0        │ 0          │
 * │ 2       │ 'Action2'   │ '3.917053 TON' │ '0 TON'        │ '0.00031 TON'  │ '0.000667 TON' │ 'N/A'         │ 0          │ '0.000309 TON' │ 0        │ 0          │
 * ```
 *
 * @param transactions List of transactions to print fees
 * @param mapFunc Optional function to map op codes to human-readable format. If provided, operation codes will be mapped; otherwise, raw hexadecimal op codes will be displayed.
 */
export function printTransactionFees(transactions: Transaction[], mapFunc?: OpMapFunc) {
    const mapOp = (op: number | string): string => {
        if (typeof op === 'string') return op;
        return mapFunc ? (mapFunc(op) ?? op.toString(16)) : op.toString(16);
    };
    // eslint-disable-next-line no-console
    console.table(
        transactions
            .map((tx) => {
                if (tx.description.type !== 'generic') return undefined;

                const body = tx.inMessage?.info.type === 'internal' ? tx.inMessage?.body.beginParse() : undefined;
                const op = body === undefined ? 'N/A' : body.remainingBits >= 32 ? body.preloadUint(32) : 'no body';

                const totalFees = formatCoins(tx.totalFees.coins);

                const computeFees = formatCoins(
                    tx.description.computePhase.type === 'vm' ? tx.description.computePhase.gasFees : undefined,
                );

                const totalFwdFees = formatCoins(tx.description.actionPhase?.totalFwdFees ?? undefined);

                const valueIn = formatCoins(
                    tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.value.coins : undefined,
                );

                const valueOut = formatCoins(
                    tx.outMessages
                        .values()
                        .reduce(
                            (total, message) =>
                                total + (message.info.type === 'internal' ? message.info.value.coins : 0n),
                            0n,
                        ),
                );

                const forwardIn = formatCoins(
                    tx.inMessage?.info.type === 'internal' ? tx.inMessage.info.forwardFee : undefined,
                );

                return {
                    op: mapOp(op),
                    valueIn,
                    valueOut,
                    totalFees: totalFees,
                    inForwardFee: forwardIn,
                    outForwardFee: totalFwdFees,
                    outActions: tx.description.actionPhase?.totalActions ?? 'N/A',
                    computeFee: computeFees,
                    exitCode: tx.description.computePhase.type === 'vm' ? tx.description.computePhase.exitCode : 'N/A',
                    actionCode: tx.description.actionPhase?.resultCode ?? 'N/A',
                };
            })
            .filter((v) => v !== undefined),
    );
}
