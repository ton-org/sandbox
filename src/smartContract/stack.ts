import BN from "bn.js";
import { Builder, Cell, Slice, StackBuilder, StackCell, StackInt, StackItem, StackNaN, StackNull, StackSlice, StackTuple } from "ton";

export const stackCell = (cell: Cell): StackCell => ({ type: 'cell', cell });
export const stackSlice = (value: Cell | Slice): StackSlice => ({ type: 'slice', cell: 'toCell' in value ? value.toCell() : value });
export const stackNumber = (value: number | BN): StackInt => ({ type: 'int', value: typeof value === 'number' ? new BN(value) : value });
export const stackTuple = (items: StackItem[]): StackTuple => ({ type: 'tuple', items });
export const stackNull = (): StackNull => ({ type: 'null' });
export const stackNan = (): StackNaN => ({ type: 'nan' });
export const stackBuilder = (value: Cell | Builder): StackBuilder => ({ type: 'builder', cell: 'endCell' in value ? value.endCell() : value });

export function stacksEqual(a: StackItem[], b: StackItem[]): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (!stackValuesEqual(a[i], b[i])) return false;
    }

    return true;
}

export function stackValuesEqual(a: StackItem, b: StackItem): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
        case 'null':
            return true;
        case 'cell':
            return a.cell.hash().equals((b as StackCell).cell.hash());
        case 'slice':
            return a.cell.hash().equals((b as StackSlice).cell.hash());
        case 'int':
            return a.value.eq((b as StackInt).value);
        case 'tuple':
            return stacksEqual(a.items, (b as StackTuple).items);
        case 'nan':
            return true;
        case 'builder':
            return a.cell.hash().equals((b as StackBuilder).cell.hash());
    }
}