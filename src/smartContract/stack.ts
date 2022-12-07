import BN from "bn.js";
import { beginCell, Cell, Slice } from "ton";

export type StackEntryCell = { type: 'cell', value: Cell };
export type StackEntryCellSlice = { type: 'cell_slice', value: Cell };
export type StackEntryNumber = { type: 'number', value: BN };
export type StackEntryTuple = { type: 'tuple', value: StackEntry[] };
export type StackEntryNull = { type: 'null' };

export type StackEntry =
    | StackEntryCell
    | StackEntryCellSlice
    | StackEntryNumber
    | StackEntryTuple
    | StackEntryNull;

export const stackCell = (value: Cell): StackEntryCell => ({ type: 'cell', value });
export const stackCellSlice = (value: Cell | Slice): StackEntryCellSlice => ({ type: 'cell_slice', value: 'toBoc' in value ? value : value.toCell() });
export const stackNumber = (value: number | BN): StackEntryNumber => ({ type: 'number', value: typeof value === 'number' ? new BN(value) : value });
export const stackTuple = (value: StackEntry[]): StackEntryTuple => ({ type: 'tuple', value });
export const stackNull = (): StackEntryNull => ({ type: 'null' });

export function stacksEqual(a: StackEntry[], b: StackEntry[]): boolean {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
        if (!stackValuesEqual(a[i], b[i])) return false;
    }

    return true;
}

export function stackValuesEqual(a: StackEntry, b: StackEntry): boolean {
    if (a.type !== b.type) return false;
    switch (a.type) {
        case 'null':
            return true;
        case 'cell':
            return a.value.hash().equals((b as StackEntryCell).value.hash());
        case 'cell_slice':
            return a.value.hash().equals((b as StackEntryCellSlice).value.hash());
        case 'number':
            return a.value.eq((b as StackEntryNumber).value);
        case 'tuple':
            return stacksEqual(a.value, (b as StackEntryTuple).value);
    }
}

function parseStackTupleRef(s: Slice, n: number): StackEntry[] {
    if (n === 0) return [];
    if (n === 1) return [sliceToStackValue(s.readRef())];
    return parseStackTuple(s.readRef(), n);
}

function parseStackTuple(s: Slice, n: number): StackEntry[] {
    if (n === 0) return [];

    return [...parseStackTupleRef(s, n-1), sliceToStackValue(s.readRef())];
}

function sliceToStackValue(s: Slice): StackEntry {
    const t = s.readUint(8).toNumber();
    switch (t) {
        case 0:
            return { type: 'null' };
        case 1:
            return { type: 'number', value: s.readInt(64) };
        case 2:
            if (s.readBit()) throw new Error('Cannot parse NaN stack value');

            const n = s.readUint(6);
            if (!n.isZero()) throw new Error('Unknown bigint continuation ' + n.toString());
            return { type: 'number', value: s.readInt(257) };
        case 3:
            return { type: 'cell', value: s.readCell() };
        case 4:
            const c = s.readCell().beginParse();
            const stBits = s.readUint(10).toNumber();
            const endBits = s.readUint(10).toNumber();
            const stRefs = s.readUint(3).toNumber();
            const endRefs = s.readUint(3).toNumber();
            if (stBits > endBits || stRefs > endRefs) throw new Error('Invalid CellSlice');
            const b = beginCell();
            c.skip(stBits);
            b.storeBitString(c.readBitString(endBits - stBits));
            for (let i = 0; i < stRefs; i++) {
                c.readCell();
            }
            for (let i = 0; i < endRefs - stRefs; i++) {
                b.storeRef(c.readCell());
            }
            return { type: 'cell_slice', value: b.endCell() };
        case 7:
            const len = s.readUint(16).toNumber();
            return { type: 'tuple', value: parseStackTuple(s, len) };
    }
    throw new Error('Unknown stack entry type ' + t.toString());
}

export const cellToStack = (cell: Cell): StackEntry[] => {
    let s = cell.beginParse();
    const depth = s.readUint(24).toNumber();
    const stack: StackEntry[] = [];
    for (let i = 0; i < depth; i++) {
        const news = s.readRef();
        stack.push(sliceToStackValue(s));
        s = news;
    }
    return stack.reverse();
};

function stackTupleRefToCell(v: StackEntry[]): Cell {
    if (v.length === 0) return new Cell();
    if (v.length === 1) return beginCell().storeRef(stackEntryToCell(v[0])).endCell();
    return beginCell().storeRef(stackTupleToCell(v)).endCell();
}

function stackTupleToCell(v: StackEntry[]): Cell {
    if (v.length === 0) return new Cell();

    return beginCell().storeCellCopy(stackTupleRefToCell(v.slice(0, v.length-1))).storeRef(stackEntryToCell(v[v.length-1])).endCell();
}

function stackEntryToCell(v: StackEntry): Cell {
    switch (v.type) {
        case 'null':
            return beginCell().storeUint(0, 8).endCell();
        case 'number':
            return beginCell().storeUint(0x0200 >> 1, 15).storeInt(v.value, 257).endCell();
        case 'cell':
            return beginCell().storeUint(3, 8).storeRef(v.value).endCell();
        case 'cell_slice':
            return beginCell().storeUint(4, 8).storeRef(v.value).storeUint(0, 10).storeUint(v.value.bits.cursor, 10).storeUint(0, 3).storeUint(v.value.refs.length, 3).endCell();
        case 'tuple':
            return beginCell().storeUint(7, 8).storeUint(v.value.length, 16).storeCellCopy(stackTupleToCell(v.value)).endCell();
    }
}

const stackEntriesToCell = (v: StackEntry[]): Cell => {
    if (v.length === 0) return new Cell();
    return beginCell().storeRef(stackEntriesToCell(v.slice(1))).storeCellCopy(stackEntryToCell(v[0])).endCell();
};

export const stackToCell = (stack: StackEntry[]): Cell => {
    const st: StackEntry[] = [];
    for (const v of stack) {
        st.unshift(v);
    }

    return beginCell()
        .storeUint(stack.length, 24)
        .storeCellCopy(stackEntriesToCell(st))
        .endCell();
};