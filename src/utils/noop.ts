export function noop(): void {}
export function noopPromise(): Promise<void> {
    return Promise.resolve();
}
