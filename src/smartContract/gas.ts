import { beginCell, Cell, GasLimitsPrices } from "ton"

export const serializeGasLimitsPrices = (gas: GasLimitsPrices): Cell => {
    const b = beginCell()
        .storeUint(0xd1, 8)
        .storeUint(gas.flatLimit, 64)
        .storeUint(gas.flatGasPrice, 64);

    const g = gas.other;
    const ext = g.specialGasLimit !== undefined;

    b.storeUint(ext ? 0xde : 0xdd, 8)
        .storeUint(g.gasPrice, 64)
        .storeUint(g.gasLimit, 64);

    if (ext) {
        b.storeUint(g.specialGasLimit, 64);
    }

    b.storeUint(g.gasCredit, 64)
        .storeUint(g.blockGasLimit, 64)
        .storeUint(g.freezeDueLimit, 64)
        .storeUint(g.deleteDueLimit, 64);

    return b.endCell();
};