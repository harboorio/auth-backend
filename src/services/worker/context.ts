import { createLogger, Logger } from "@infra/logger/logger";
import type { DatabasePool } from "slonik";
import { MessageCatalog, msgs } from "@infra/message-catalog/message-catalog";
import { createEnvironment } from "@infra/environment/index";
import { fetchSecretsAws } from "@harboor/core";
import { DOMAIN_ID, REDACT } from "@src/config";
import { establishPostgresConn } from "@infra/postgres/postgres";
import { EmailGateway } from "@infra/email-gateway/index";
import { establishClickhouseConn } from "@infra/clickhouse/index";
import { NodeClickHouseClient } from "@clickhouse/client/dist/client";

export interface WorkerContext {
    env: ReturnType<typeof createEnvironment>;
    logger: Logger;
    msgs: MessageCatalog;
    pgpool: DatabasePool;
    clickhouse: NodeClickHouseClient;
    emailGateway: EmailGateway;
}

export const workerContext = (function createContext() {
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
        const pgpool = await establishPostgresConn({ connStr: env.get("POSTGRES_CONN_STR") });
        const clickhouse = await establishClickhouseConn({ connStr: env.get("CLICKHOUSE_CONN_URI") });
        const emailGateway = new EmailGateway("postmark", { serverToken: env.get("POSTMARK_SERVER_TOKEN") });

        context = { logger, msgs, pgpool, env, clickhouse, emailGateway };
    }

    function get() {
        return context as WorkerContext;
    }

    return {
        configure,
        get,
    };
})();
