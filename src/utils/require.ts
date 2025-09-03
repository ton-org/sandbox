export function requireOptional(id: string): ReturnType<typeof require> | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(id);
    } catch (error) {
        if (String(error).includes('Cannot find module')) {
            return undefined;
        }

        throw error;
    }
}
