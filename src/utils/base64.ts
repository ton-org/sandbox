// Credits: https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_2_–_rewriting_atob_and_btoa_using_typedarrays_and_utf-8

function b64ToUint6(nChr: number) {
    return nChr > 64 && nChr < 91
        ? nChr - 65
        : nChr > 96 && nChr < 123
          ? nChr - 71
          : nChr > 47 && nChr < 58
            ? nChr + 4
            : nChr === 43
              ? 62
              : nChr === 47
                ? 63
                : 0;
}

export function base64Decode(sBase64: string) {
    const sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, '');
    const nInLen = sB64Enc.length;
    const nOutLen = (nInLen * 3 + 1) >> 2;
    const taBytes = new Uint8Array(nOutLen);

    let nMod3;
    let nMod4;
    let nUint24 = 0;
    let nOutIdx = 0;
    for (let nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
            nMod3 = 0;
            while (nMod3 < 3 && nOutIdx < nOutLen) {
                taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
                nMod3++;
                nOutIdx++;
            }
            nUint24 = 0;
        }
    }

    return taBytes;
}
