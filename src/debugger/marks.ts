import { beginCell, Cell, Dictionary, DictionaryValue, Slice } from '@ton/core';

type CellInfo = {
    isNormal: boolean;
    marks: Dictionary<number, Dictionary<number, null>>;
};

const MarksDictValue: DictionaryValue<Dictionary<number, null>> = {
    parse(src) {
        return src
            .loadRef()
            .beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(10), {
                parse(_src) {
                    return null;
                },
                serialize(_src, _builder) {
                    throw new Error('Not implemented');
                },
            });
    },
    serialize(_src, _builder) {
        throw new Error('Not implemented');
    },
};

const CellInfoValue: DictionaryValue<CellInfo> = {
    parse(src) {
        return {
            isNormal: src.loadBit(),
            marks: src.loadDict(Dictionary.Keys.Uint(32), MarksDictValue),
        };
    },
    serialize(_src, _builder) {
        throw new Error('Not implemented');
    },
};

const CellValue: DictionaryValue<Cell> = {
    parse(src) {
        return src.asCell();
    },
    serialize(_src, _builder) {
        throw new Error('Not implemented');
    },
};

function sliceToString(slice: Slice, len: number): string {
    let out = '';
    for (let i = 0; i < len; i++) {
        out += slice.loadBit() ? '1' : '0';
    }
    return out;
}

function readLabel(slice: Slice, m: number): string {
    if (slice.loadBit()) {
        if (slice.loadBit()) {
            const bit = slice.loadBit();
            const len = slice.loadUint(Math.ceil(Math.log2(m + 1)));
            return (bit ? '1' : '0').repeat(len);
        } else {
            const len = slice.loadUint(Math.ceil(Math.log2(m + 1)));
            return sliceToString(slice, len);
        }
    } else {
        let len = 0;
        while (slice.loadBit()) {
            len++;
        }
        return sliceToString(slice, len);
    }
}

function getFinalSlice(dc: Cell, key: string): Cell {
    const dict = dc.beginParse();
    const lbl = readLabel(dict, key.length);
    if (!key.startsWith(lbl)) {
        throw new Error('Invalid label');
    }
    if (lbl.length === key.length) {
        return dc;
    }
    let child: Cell = dict.loadRef();
    if (key[lbl.length] === '1') {
        child = dict.loadRef();
    }
    return getFinalSlice(child, key.slice(lbl.length + 1));
}

function hashToString(hash: Buffer): string {
    return hash.toString('hex').toUpperCase();
}

function getRealCodeHashes(code: Cell): Map<string, { hash: string; diff: number }> {
    const dictC = code.beginParse().loadRef();
    const d = dictC.beginParse().loadDictDirect(Dictionary.Keys.Int(19), CellValue);
    const r = new Map<string, { hash: string; diff: number }>();
    for (const [idx, v] of d) {
        const idxKey = sliceToString(beginCell().storeInt(idx, 19).endCell().beginParse(), 19);
        const finalSlice = getFinalSlice(dictC, idxKey);
        const originalSlice = d.get(idx);
        if (originalSlice === undefined) {
            throw new Error('Unknown original slice');
        }
        r.set(hashToString(v.hash()), {
            hash: hashToString(finalSlice.hash()),
            diff: finalSlice.bits.length - originalSlice.bits.length,
        });
    }
    return r;
}

export function parseMarks(marksCell: Cell, code: Cell): Map<string, Map<number, number[]>> {
    const realCodeHashes = getRealCodeHashes(code);

    const d = marksCell.beginParse().loadDictDirect(Dictionary.Keys.Buffer(32), CellInfoValue);

    const r = new Map<string, Map<number, number[]>>();

    for (const [hash, info] of d) {
        const hashStr = hashToString(hash);
        const finalHash = info.isNormal ? hashStr : realCodeHashes.get(hashStr)?.hash;
        if (finalHash === undefined) {
            continue;
        }
        const marks = new Map<number, number[]>();
        for (const [mark, offsets] of info.marks) {
            for (const offset of offsets.keys()) {
                const adjustedOffset = offset + (info.isNormal ? 0 : (realCodeHashes.get(hashStr)?.diff ?? 0));
                const arr = marks.get(adjustedOffset) ?? [];
                arr.push(mark);
                marks.set(adjustedOffset, arr);
            }
        }
        r.set(finalHash, marks);
    }

    return r;
}
