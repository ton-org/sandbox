import BN from "bn.js";
import { Cell, Slice } from "ton";
import { TVMStackEntry } from "../emulator-exec/emulatorExec";

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

export const oneStackEntryToTVM = (e: StackEntry): TVMStackEntry => {
    switch (e.type) {
        case 'cell':
            return { type: 'cell', value: e.value.toBoc().toString('base64') };
        case 'cell_slice':
            return { type: 'cell', value: e.value.toBoc().toString('base64') };
        case 'number':
            return { type: 'number', value: e.value.toString() };
        case 'tuple':
            return { type: 'tuple', value: e.value.map(te => oneStackEntryToTVM(te)) };
        case 'null':
            return { type: 'null' };
    }
};

export const oneTVMToStackEntry = (e: TVMStackEntry): StackEntry => {
    switch (e.type) {
        case 'cell':
            return { type: 'cell', value: Cell.fromBoc(Buffer.from(e.value, 'base64'))[0] };
        case 'cell_slice':
            return { type: 'cell_slice', value: Cell.fromBoc(Buffer.from(e.value, 'base64'))[0] };
        case 'number':
            return { type: 'number', value: new BN(e.value, 10) };
        case 'tuple':
            return { type: 'tuple', value: e.value.map(te => oneTVMToStackEntry(te)) };
        case 'null':
            return { type: 'null' };
    }
};