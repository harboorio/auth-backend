import { createLogger, Logger } from "@infra/logger/logger";
import type { RedisClientType } from "redis";
import type { DatabasePool } from "slonik";
import type { Channel, ChannelModel } from "amqplib";
import { MessageCatalog, msgs } from "@infra/message-catalog/message-catalog";
import { createEnvironment } from "@infra/environment/index";
import { fetchSecretsAws } from "@harboor/core";
import { DOMAIN_ID, REDACT } from "@src/config";
import { establishRedisConn } from "@infra/redis/redis";
import { establishPostgresConn } from "@infra/postgres/postgres";
import { establishMqConn } from "@infra/mq/mq";

export interface ServerContext {
    env: ReturnType<typeof createEnvironment>;
    logger: Logger;
    msgs: MessageCatalog;
    redis: RedisClientType;
    pgpool: DatabasePool;
    mq: {
        conn: ChannelModel;
        channel: Channel;
    };
}

export const serverContext = (function createContext() {
    let context = {};

    async function configure(nodeEnv: string) {
        const secrets =
            nodeEnv !== "production"
                ? process.env
                : await fetchSecretsAws<Record<string, string>>({
                      aws: {
                          secretName: "prod/harboor/auth",
                          credentials: {
                              region: process.env.AWS_REGION,
                              accessKey: process.env.AWS_ACCESS_KEY,
                              accessKeySecret: process.env.AWS_ACCESS_KEY_SECRET,
                          },
                      },
                  });
        const env = createEnvironment(secrets);
        const logger = createLogger({ name: DOMAIN_ID, level: env.get("APP_LOG_LEVEL") as any, redact: REDACT });
        const redis = await establishRedisConn({ connStr: env.get("REDIS_CONN_STR"), logger });
        const pgpool = await establishPostgresConn({ connStr: env.get("POSTGRES_CONN_STR") });
        const mqchannels = ["maintenance", "tracing", "notification"];
        const mq = await establishMqConn({ connStr: env.get("RABBITMQ_CONN_STR"), channels: mqchannels });

        context = { logger, msgs, redis: redis.conn, pgpool, mq, env };
    }

    function get() {
        return context as ServerContext;
    }

    return {
        configure,
        get,
    };
})();
