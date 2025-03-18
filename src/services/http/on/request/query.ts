import { URL } from "node:url";
import http from "node:http";

export function readUrl(req: http.IncomingMessage): URL & { searchParams: Record<string, string> } {
    const url = new URL(`http://${process.env.HOST ?? "localhost"}${req.url ?? "/"}`);
    const searchParams: Record<string, string> = {};

    if (url.searchParams.size > 0) {
        for (const [key, value] of url.searchParams.entries()) {
            searchParams[key] = value;
        }
    }

    return Object.assign({}, url, { searchParams });
}
