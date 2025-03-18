import { createClient, type RedisClientType } from "redis";
import { type Logger } from "@infra/logger/logger";

function reconnectStrategy(retries: number, _cause: Error) {
    const delay = Math.pow(1.25, retries);
    return delay > 100 ? false : delay;
}

export async function establishRedisConn({ connStr, logger }: { connStr: string; logger: Logger }) {
    const opts = {
        url: connStr,
        socket: {
            reconnectStrategy,
        },
    };
    const redis = createClient(opts)
        .on("error", (e: Error) => logger.error(e, "redis connection error"))
        .on("reconnecting", () => logger.info("redis is trying to reconnect..."))
        .on("ready", () => logger.info("redis is ready")) as RedisClientType;

    await redis.connect();

    return {
        conn: redis,
    };
}
