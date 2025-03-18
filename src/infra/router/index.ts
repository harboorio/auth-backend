import http from "node:http";
import { parse } from "regexparam";
import { RequestContext } from "@services/http/on/request/context";
import { ServerContext } from "@services/http/context";
import { type JSONSchema } from "json-schema-to-ts";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";

export type Route = {
    name: string;
    method: http.IncomingMessage["method"];
    pattern: string;
    body?: JSONSchema;
    query?: JSONSchema;
    params?: JSONSchema;
    response?: JSONSchema;
    trace?: boolean;
    handler: (
        requestStore: RequestContext,
        serverStore: ServerContext,
    ) =>
        | Record<string, unknown>
        | Record<string, unknown>[]
        | ApplicationHttpError
        | Promise<Record<string, unknown> | Record<string, unknown>[] | ApplicationHttpError>;
};

class Router {
    private routes: Route[] = [];
    private locked = false;

    match(req: http.IncomingMessage) {
        let i = 0;
        while (i < this.routes.length) {
            const r = this.routes[i];

            if (req.method && r.method && req.method.toLowerCase() === r.method.toLowerCase()) {
                const params = matchPath(r.pattern, req.url ?? "/");

                if (params !== null) {
                    return {
                        params,
                        route: r,
                    };
                }
            }

            i++;
        }

        return {
            params: null,
            route: null,
        };

        function matchPath(pattern: string, path: string): Record<string, string> | null {
            try {
                const parsed = parse(pattern);
                return parsed.pattern.test(path) ? resolvePathParams(path, parsed) : null;
            } catch (e) {
                return null;
            }
        }

        function resolvePathParams(path: string, parsed: { keys: string[]; pattern: RegExp }): Record<string, string> {
            if (parsed.keys.length === 0) {
                return {};
            }

            const matches = parsed.pattern.exec(path);

            if (!matches) {
                return {};
            }

            matches.shift();

            return matches.reduce((memo: Record<string, string>, value, i) => {
                memo[parsed.keys[i]] = value;
                return memo;
            }, {});
        }
    }

    append(route: Route) {
        if (this.locked) return;
        this.routes.push(route);
    }

    lock() {
        this.locked = true;

        // sort routes by depth
        this.routes = this.routes.sort((a, b) => {
            const alen = a.pattern.split("/");
            const blen = b.pattern.split("/");
            return alen > blen ? -1 : alen === blen ? 0 : -1;
        });
    }
}

export const router = new Router();
