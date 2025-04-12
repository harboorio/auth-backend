import http from "node:http";
import { Route } from "@infra/router/index";
import { ServerContext } from "@src/context";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";

export type RequestMiddleware = (
    server: ServerContext,
    req: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
    context: any,
) => unknown | Promise<unknown>;
export type RouteMiddleware = (
    server: ServerContext,
    req: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
    route: Route<any>,
    context: any,
) => unknown | Promise<unknown>;

export class MiddlewareRunner {
    private requestMiddlewares: RequestMiddleware[] = [];
    private routeMiddlewares: RouteMiddleware[] = [];

    addRequestMiddleware(func: RequestMiddleware) {
        this.requestMiddlewares.push(func);
    }

    addRouteMiddleware(func: RouteMiddleware) {
        this.routeMiddlewares.push(func);
    }

    async runRequestMiddlewares<T>(
        server: ServerContext,
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
    ): Promise<T | ApplicationHttpError | Error> {
        const self = this;

        let context: Record<string, unknown> = {};
        let index = 0;

        async function runOne() {
            const func = self.requestMiddlewares[index];

            try {
                const result = await Promise.resolve(func(server, req, res, context));

                if (result instanceof ApplicationHttpError) {
                    return result;
                }

                if (self.isObject(result)) {
                    context = Object.assign({}, context, result);
                }
            } catch (e) {
                console.error(e);
                return e;
            }

            index += 1;
            if (self.requestMiddlewares.length === index) return context;
            else return await runOne();
        }

        return await runOne();
    }

    async runRouteMiddlewares<T>(
        server: ServerContext,
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
        route: Route<any>,
    ): Promise<T | ApplicationHttpError | Error> {
        const self = this;

        let context: Record<string, unknown> = {};
        let index = 0;

        async function runOne() {
            const func = self.routeMiddlewares[index];

            try {
                const result = await Promise.resolve(func(server, req, res, route, context));

                if (result instanceof ApplicationHttpError) {
                    return result;
                }

                if (self.isObject(result)) {
                    context = Object.assign({}, context, result);
                }
            } catch (e) {
                console.error(e);
                return e;
            }

            index += 1;
            if (self.routeMiddlewares.length === index) return context;
            else return await runOne();
        }

        return await runOne();
    }

    isObject(v: unknown): v is object {
        return !!v && v.constructor === Object;
    }
}

export const middlewares = new MiddlewareRunner();
