import pino from "pino";
import { pathv } from "@harboor/core";
import path from "node:path";

export { type Logger } from "pino";

export function createLogger({ name, level, redact }: { name: string; level: pino.Level; redact: string[] }) {
    return pino({
        name,
        level,
        redact,
        transport: {
            targets: [
                {
                    target:
                        process.env.NODE_ENV === "test"
                            ? path.resolve(import.meta.dirname, "./transport-pretty.mjs")
                            : pathv("@infra/logger/transport-pretty.mjs"),
                },
            ],
        },
    });
}
