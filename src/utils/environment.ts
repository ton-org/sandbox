export function isBrowser(): boolean {
    // eslint-disable-next-line no-undef
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
