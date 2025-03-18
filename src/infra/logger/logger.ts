import pino from "pino";
import { pathv } from "@harboor/core";

export { type Logger } from "pino";

export function createLogger({ name, level, redact }: { name: string; level: pino.Level; redact: string[] }) {
    return pino({
        name,
        level,
        redact,
        transport: {
            targets: [
                {
                    target: pathv("@infra/logger/transport-pretty.mjs"),
                },
            ],
        },
    });
}
