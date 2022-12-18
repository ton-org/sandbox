import { beginCell, Cell, parseStack, StackItem } from "ton";

export const parseC7 = (c7: string): StackItem[] => {
    const c = Cell.fromBoc(Buffer.from(c7, 'base64'))[0];

    // this needs to be refactored
    const stackCell = beginCell().storeUint(1, 24).storeRef(new Cell()).storeCellCopy(c).endCell();
    const s = parseStack(stackCell);
    if (s.length !== 1 || s[0].type !== 'tuple') throw new Error('c7 is not valid');

    return s[0].items;
};