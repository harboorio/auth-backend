import { OriginService, OriginStore } from "@features/origin/index";
import { middlewares } from "@infra/middleware-runner/index";
import proxyAddr from "proxy-addr";
import { cached } from "@infra/cached/index";
import { resolveAcceptLanguage } from "resolve-accept-language";
import { AVAILABLE_LOCALES, DOMAIN_ID, REDACT } from "@src/config";
import { getTranslationFunction } from "@infra/message-catalog/index";
import { parse as parseAuthHeader, Token } from "auth-header";
import { Tracing } from "@infra/tracing/tracing";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";

middlewares.addRequestMiddleware(function readUserData(server, req, res, context) {
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

    return { userAddrs, t, userAuthData };
});

middlewares.addRequestMiddleware(async function verifyRequestOrigin(server, req, res, context) {
    const store = new OriginStore(server.pgpool);
    const service = new OriginService(store, server);
    const origin = await service.findByOrigin(req.headers["origin"] ?? undefined);

    if (!origin) {
        if (server.env.get("NODE_ENV") !== "production") {
            const fake = await service.fakeOrigin(origin ?? "http://localhost");
            return { origin: fake };
        }

        return new ApplicationHttpError((context["t"] as any)("error_domain_not_authorized"), "app_auth", 400);
    }

    return { origin };
});

middlewares.addRouteMiddleware(function initTracing(server, req, res, route, context) {
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
        server.mq.channel.sendToQueue("tracing", Buffer.from(JSON.stringify(trace)), { persistent: true });
        server.logger.info("message sent to tracing worker");
    });

    return { tracing };
});

middlewares.addRouteMiddleware(function createRequestLogger(server, req, res, route, context) {
    const logger = server.logger.child({
        httpRequestMethod: req.method,
        httpRequestUrl: req.url,
        traceId: context.tracing.getId(),
    });

    return { logger };
});
