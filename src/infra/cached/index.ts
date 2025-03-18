class Cached {
    store: Map<string, Map<any, unknown>> = new Map();

    run<T>(id: string, func: Function, ...args: any[]): T | Error {
        if (!this.store.has(id)) {
            this.store.set(id, new Map());
        }

        if (this.store.get(id)!.has(args)) {
            return this.store.get(id)!.get(args) as T;
        }

        try {
            const result = func(...args);
            this.store.get(id)!.set(args, result);
            return result as T;
        } catch (e) {
            return e;
        }
    }
}

export const cached = new Cached();
