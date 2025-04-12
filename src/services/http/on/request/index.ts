import { serverContext } from "@src/context";
import * as http from "node:http";
import { readBody } from "@services/http/on/request/body";
import { readUrl } from "@services/http/on/request/query";
import { router } from "@infra/router/index";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";
import { Responder } from "@infra/responder/index";
import { middlewares } from "@infra/middleware-runner/index";
import { getTranslationFunction } from "@infra/message-catalog/index";
import { Token } from "auth-header";
import { Tracing } from "@infra/tracing/tracing";
import { Logger } from "pino";
import "@services/http/on/request/middlewares/index";
import { Origin } from "@features/origin/index";

export interface RequestMiddlewareContext {
    userAddrs: string[];
    t: ReturnType<typeof getTranslationFunction>;
    userAuthData: Token;
    origin: Origin;
    [k: string]: unknown;
}

export interface RouteMiddlewareContext {
    tracing: Tracing;
    logger: Logger;
    [k: string]: unknown;
}

export type RequestContext = {
    url: ReturnType<typeof readUrl>;
    params: Record<string, string> | null;
    body: object | null;
    responder: Responder;
} & RequestMiddlewareContext &
    RouteMiddlewareContext;

export default async function onRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
) {
    const context = serverContext.get();

    context.logger.info(req.method + " " + req.url);

    const responder = new Responder(req, res, (context.env.get("APP_REQUEST_ORIGINS") ?? "").split(",")).cors(
        true,
        ["HEAD", "GET", "POST", "PUT"],
        ["Origin", "Authorization", "X-Requested-With", "Content-Type", "Accept", "Accept-Language"],
        3600,
    );
    const requestMiddlewareContext = await middlewares.runRequestMiddlewares<RequestMiddlewareContext>(
        context,
        req,
        res,
    );
    if (requestMiddlewareContext instanceof ApplicationHttpError) {
        return responder.json(requestMiddlewareContext.toUser(), requestMiddlewareContext.httpStatus);
    }
    if (requestMiddlewareContext instanceof Error) {
        return responder.serverError();
    }

    const { route, params } = router.match(req);

    if (!route) {
        return responder.notFound();
    }

    const url = readUrl(req);
    const readBodyResult = await readBody(req, context, requestMiddlewareContext.t);
    if (readBodyResult.err) {
        return responder.json(readBodyResult.err.toUser());
    }
    const contentType = req.headers["content-type"] ?? "";
    const isJson = contentType === "application/json";
    let body: object | null = null;
    if (isJson && readBodyResult.data) {
        try {
            body = JSON.parse(readBodyResult.data.toString("utf-8"));
        } catch (e) {}
    }

    const routeMiddlewareContext = await middlewares.runRouteMiddlewares<RouteMiddlewareContext>(
        context,
        req,
        res,
        route,
    );
    if (routeMiddlewareContext instanceof ApplicationHttpError) {
        return responder.json(routeMiddlewareContext.toUser(), routeMiddlewareContext.httpStatus);
    }
    if (routeMiddlewareContext instanceof Error) {
        return responder.serverError();
    }

    res.on("finish", function onResponseFinish() {
        routeMiddlewareContext.tracing.getRootSpan().end();
        routeMiddlewareContext.tracing.end();
    });

    const requestStore: RequestContext = Object.assign(
        {},
        {
            url,
            params,
            body,
            responder,
        },
        requestMiddlewareContext,
        routeMiddlewareContext,
    );

    if (body && route.validateBody && !route.validateBody(body)) {
        requestStore.logger.debug(route.validateBody.errors);
        const err = new ApplicationHttpError(requestStore.t("error_bad_request"), "schema_validation", 400);
        return responder.json(err.toUser(), err.httpStatus);
    }

    try {
        const result = await route.handler(requestStore, context);

        if (result instanceof ApplicationHttpError) {
            return responder.json(result.toUser(), result.httpStatus);
        }

        return responder.json(result);
    } catch (e) {
        requestStore.logger.debug(e);
        const _err = new ApplicationHttpError(requestStore.t("error_unexpected"), "route_handler", 500, { cause: e });
        return responder.json(_err.toUser());
    }
}
