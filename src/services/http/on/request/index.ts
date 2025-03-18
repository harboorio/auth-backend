import { serverContext } from "@services/http/context";
import * as http from "node:http";
import { resolveAcceptLanguage } from "resolve-accept-language";
import { parse as parseAuthHeader, Token } from "auth-header";
import { getTranslationFunction } from "@infra/message-catalog/index";
import { AVAILABLE_LOCALES, DOMAIN_ID, REDACT } from "@src/config";
import { readBody } from "@services/http/on/request/body";
import { readUrl } from "@services/http/on/request/query";
import { router } from "@infra/router/index";
import { requestContext } from "@services/http/on/request/context";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";
import { cached } from "@infra/cached/index";
import { Responder } from "@infra/responder/index";
import { Tracing } from "@infra/tracing/tracing";
import proxyAddr from "proxy-addr";

export default async function onRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
) {
    const serverStore = serverContext.getStore()!;

    serverStore.logger.info(req.method + " " + req.url);

    const responder = new Responder(req, res, (serverStore.env.get("APP_REQUEST_ORIGINS") ?? "").split(",")).cors(
        true,
        ["HEAD", "GET", "POST", "PUT"],
        ["Origin", "Authorization", "X-Requested-With", "Content-Type", "Accept", "Accept-Language"],
        3600,
    );
    const userAddrs = proxyAddr.all(req);
    const userLocale = cached.run<string>(
        "acceptLanguage",
        resolveAcceptLanguage,
        req.headers["accept-language"] ?? "",
        AVAILABLE_LOCALES,
        AVAILABLE_LOCALES[0],
    );
    const t = getTranslationFunction(userLocale instanceof Error ? AVAILABLE_LOCALES[0] : userLocale);

    let userAuthData: Token = { scheme: "", token: null, params: {} };
    try {
        userAuthData = parseAuthHeader(req.headers["authorization"] ?? "");
    } catch (e) {}

    const readBodyResult = await readBody(req, serverStore, t);

    if (readBodyResult.err) {
        return responder.json(readBodyResult.err.toUser());
    }

    const { route, params } = router.match(req);

    if (!route) {
        return responder.notFound();
    }

    const url = readUrl(req);
    const tracing = new Tracing({
        projectName: DOMAIN_ID,
        serviceName: route.name,
        attrs: {
            "os.arch": process.arch,
            "os.platform": process.platform,
            "os.pid": process.pid,
            "node.version": process.version,
            "http.method": req.method,
            "http.url": req.url,
        },
        redact: REDACT,
    });
    tracing.createRootSpan({ name: "root" });
    tracing.on("trace", async (trace) => {
        serverStore.mq.channel.sendToQueue("tracing", Buffer.from(JSON.stringify(trace)), { persistent: true });
        serverStore.logger.info("message sent to tracing worker");
    });
    const requestLogger = serverStore.logger.child({
        httpRequestMethod: req.method,
        httpRequestUrl: req.url,
        traceId: tracing.getId(),
    });

    res.on("finish", function onResponseFinish() {
        tracing.getRootSpan().end();
        tracing.end();
    });

    return requestContext.run(
        { t, url, params, body: {}, tracing, logger: requestLogger, userAddrs, userAuthData },
        async function onRequestContextReady() {
            const requestStore = requestContext.getStore()!;

            try {
                const result = await route.handler(requestStore, serverStore);

                if (result instanceof ApplicationHttpError) {
                    return res.end(result.toUser());
                }

                return responder.json(result);
            } catch (e) {
                const _err = new ApplicationHttpError(t("error_unexpected"), "route_handler", 500, { cause: e });
                return responder.json(_err.toUser());
            }
        },
    );
}
