/**
 * Decodes a binary patch using a reference file to reconstruct the target file.
 *
 * @param reference - The reference data
 * @param patch - The patch data to decode
 * @returns The decoded target data
 * @throws When patch is truncated or reference bounds are exceeded
 */
export function decodePatch(reference: Uint8Array, patch: Uint8Array) {
    const target = [];
    let i = 0;

    while (i < patch.length) {
        const controlByte = patch[i];
        i += 1;

        if ((controlByte & 0x80) === 0) {
            const literalLength = controlByte + 1;
            if (i + literalLength > patch.length) {
                throw new Error(
                    `Patch truncated: expected ${literalLength} bytes but only ${patch.length - i} remaining`,
                );
            }

            for (let j = 0; j < literalLength; j++) {
                target.push(patch[i + j]);
            }
            i += literalLength;
        } else {
            const bytesNeeded = (controlByte & 0x7f) + 1;

            if (i + bytesNeeded * 2 > patch.length) {
                throw new Error(
                    `Patch truncated: expected ${bytesNeeded * 2} bytes but only ${patch.length - i} remaining`,
                );
            }

            let matchOffset = 0;
            for (let j = 0; j < bytesNeeded; j++) {
                matchOffset |= patch[i + j] << (j * 8);
            }
            i += bytesNeeded;

            let matchLength = 0;
            for (let j = 0; j < bytesNeeded; j++) {
                matchLength |= patch[i + j] << (j * 8);
            }
            i += bytesNeeded;

            if (matchOffset + matchLength > reference.length) {
                throw new Error(
                    `Reference bounds exceeded: offset ${matchOffset} + length ${matchLength} > reference size ${reference.length}`,
                );
            }

            for (let j = 0; j < matchLength; j++) {
                target.push(reference[matchOffset + j]);
            }
        }
    }

    return new Uint8Array(target);
}
