import { Cell, RawAccountStorage, RawStorageUsed } from "ton";
import { encodeAccountStorage } from "./encode";

const calcCellStorageUsed = (c: Cell, dup?: Set<string>): { bits: number, cells: number } => {
    const h = c.hash().toString('hex');
    if (dup !== undefined) {
        if (dup.has(h)) return { bits: 0, cells: 0 };
        dup.add(h);
    }
    const used = { bits: c.bits.cursor, cells: 1 };
    for (const r of c.refs) {
        const rused = calcCellStorageUsed(r, dup);
        used.bits += rused.bits;
        used.cells += rused.cells;
    }
    return used;
};

export const calcStorageUsed = (storage: RawAccountStorage): RawStorageUsed => {
    const c = encodeAccountStorage(storage);
    const used = calcCellStorageUsed(c, new Set<string>());
    return {
        ...used,
        publicCells: 0,
    };
};