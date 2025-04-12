export class DomainEntity {
    constructor() {}

    init(obj: Record<string, unknown>) {
        const props = Object.getOwnPropertyNames(this);

        if (obj)
            Object.keys(obj)
                .filter((_prop) => props.includes(_prop))
                .forEach((prop) => {
                    this[prop as keyof typeof this] = obj[prop as keyof typeof obj] as any;
                });
    }

    toObject() {
        const props = Object.getOwnPropertyNames(this);
        return props.reduce(
            (memo, prop) =>
                Object.assign({}, memo, {
                    [prop]: this[prop as keyof typeof this],
                }),
            {},
        );
    }
}
