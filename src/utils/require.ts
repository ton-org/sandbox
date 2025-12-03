// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireTestUtils(): any | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require('@ton/test-utils');
    } catch {
        return undefined;
    }
}
