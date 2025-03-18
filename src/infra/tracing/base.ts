import { BROWSER, NODE } from "esm-env";

export type TracingAttrs = {
    [index: string]: unknown;
};

export class TracingBase {
    env: "browser" | "node" = BROWSER ? "browser" : NODE ? "node" : "node";

    getNodeResourceUsages() {
        return {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
        };
    }

    getTimestamp() {
        return new Date();
    }

    redactAttrs(attrs: Record<string, unknown>, redact: string[] = []) {
        return redact.length > 0
            ? Object.keys(attrs).reduce(
                  (memo: Record<string, unknown>, name) =>
                      Object.assign({}, memo, {
                          [name]: redact.includes(name) ? "[REDACTED]" : attrs[name as keyof typeof attrs],
                      }),
                  {},
              )
            : attrs;
    }

    objectifyError(e: Error): Record<string, string> {
        return Object.getOwnPropertyNames(e).reduce((memo: Record<string, string>, name) => {
            if (name === "cause" && e[name] instanceof Error) {
                const obj = this.objectifyError(e[name]);
                Object.keys(obj).map((k) => (memo[`cause.${k}`] = obj[k]!));
            } else {
                memo[name] =
                    name === "stack"
                        ? serializeStack(e[name]!)
                        : typeof e[name as keyof typeof e] === "string"
                          ? (e[name as keyof typeof e] as string)
                          : "*** redacted because of an unrecognized type";
            }

            return memo;
        }, {});

        function serializeStack(multilineText: string) {
            return multilineText
                .split(/[\n]/g)
                .map((line) => line.trim())
                .join("\n");
        }
    }
}
