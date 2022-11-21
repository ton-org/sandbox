import { Cell } from "ton";
import { AccountState } from "./encode";

const decodeMaybeBoc = (boc: string | undefined | null): Cell | undefined => {
    return typeof boc === 'string' ? Cell.fromBoc(Buffer.from(boc, 'base64'))[0] : undefined;
};

export type APIAccountState = { type: 'uninit' }
    | { type: 'active', code: string | undefined | null, data: string | undefined | null }
    | { type: 'frozen', stateHash: string };

export const encodeAPIAccountState = (st: APIAccountState): AccountState => {
    switch (st.type) {
        case 'uninit':
            return { type: 'uninit' };
        case 'active':
            return {
                type: 'active',
                code: decodeMaybeBoc(st.code),
                data: decodeMaybeBoc(st.data),
            };
        case 'frozen':
            return {
                type: 'frozen',
                stateHash: Buffer.from(st.stateHash, 'base64'),
            };
    }
};