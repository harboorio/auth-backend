export class ApplicationError extends Error {
    code: string;

    constructor(message: string, code: string, opts?: { cause: Error }) {
        super(message, opts ?? undefined);

        this.code = code;
    }

    toUser() {
        return {
            error: {
                code: this.code,
                message: this.message,
            },
        };
    }

    static toUserDefault() {
        return {
            error: {
                code: "unexpected",
                message: "",
            },
        };
    }
}

export class ApplicationHttpError extends ApplicationError {
    httpStatus: number;

    constructor(message: string, code: string, status: number, opts?: { cause: Error }) {
        super(message, code, opts ?? undefined);

        this.httpStatus = status;
    }

    override toUser() {
        return {
            error: {
                code: this.code,
                message: this.message,
            },
        };
    }

    static override toUserDefault() {
        return {
            error: {
                code: "unexpected",
                message: "",
            },
        };
    }

    static getDefaultHttpStatus() {
        return 500;
    }
}
