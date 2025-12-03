// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireOptional(id: string): any | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(id);
    } catch {
        return undefined;
    }
}
