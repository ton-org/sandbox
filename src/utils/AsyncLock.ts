type Waiter = { promise: Promise<void>; resolve: () => void };

function createWaiter(): Waiter {
    let resolveFn!: () => void;
    const promise = new Promise<void>((res) => {
        resolveFn = res;
    });
    return { promise, resolve: resolveFn };
}

export class AsyncLock {
    #waiters: Waiter[] = [];

    async acquire() {
        const waiters = this.#waiters.map((w) => w.promise);
        this.#waiters.push(createWaiter());
        if (waiters.length > 0) {
            await Promise.all(waiters);
        }
    }

    async release() {
        const waiter = this.#waiters.shift();
        if (waiter !== undefined) {
            waiter.resolve();
        } else {
            throw new Error('The lock is not locked');
        }
    }

    async with<T>(fn: () => Promise<T>) {
        await this.acquire();
        try {
            return await fn();
        } finally {
            await this.release();
        }
    }
}
