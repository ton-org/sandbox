import { Cell } from "ton";

export const bocOrCellToStr = (input: Cell | string): string => typeof input === 'string' ? input : input.toBoc().toString('base64');