import * as http from "node:http";
import { createLogger } from "@infra/logger/logger";
import { DOMAIN_ID, REDACT } from "@src/config";
import { establishRedisConn } from "@infra/redis/redis";
import { establishPostgresConn } from "@infra/postgres/postgres";
import { establishMqConn } from "@infra/mq/mq";
import { serverContext } from "@services/http/context";
import { onClientError, onDropRequest, onRequest } from "@services/http/on/index";
import { msgs } from "@infra/message-catalog/index";
import en from "@infra/message-catalog/messages/en-US.json";
import tr from "@infra/message-catalog/messages/tr-TR.json";
import "@features/index";
import { router } from "@infra/router/index";
import { createEnvironment } from "@infra/environment/index";

export async function initServer(env: ReturnType<typeof createEnvironment>) {
    const logger = createLogger({ name: DOMAIN_ID, level: env.get("APP_LOG_LEVEL") as any, redact: REDACT });
    const redis = await establishRedisConn({ connStr: env.get("REDIS_CONN_STR"), logger });
    const pgpool = await establishPostgresConn({ connStr: env.get("POSTGRES_CONN_STR") });
    const mqchannels = ["maintenance", "tracing", "notification"];
    const mq = await establishMqConn({ connStr: env.get("RABBITMQ_CONN_STR"), channels: mqchannels });

    msgs.setup({ "en-US": en, "tr-TR": tr });

    const _serverStore = { logger, msgs, redis: redis.conn, pgpool, mq, env };

    serverContext.run(_serverStore, function onServerContextReady() {
        router.lock();

        const server = http.createServer({
            keepAliveTimeout: 30000,
            requestTimeout: 30000,
        });

        server.on("request", onRequest);
        server.on("dropRequest", onDropRequest);
        server.on("clientError", onClientError);

        server.listen(3000, "0.0.0.0", () => {
            logger.info("Server is online.");
        });

        process.on("unhandledRejection", (err) => {
            logger.error(err, "Unhandled rejection.");
            throw err;
        });

        process.on("uncaughtException", (err) => {
            logger.error(err, "Uncaught exception.");
            throw err;
        });
    });
}
