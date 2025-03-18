import { AsyncLocalStorage } from "node:async_hooks";
import type { Logger } from "@infra/logger/logger";
import type { RedisClientType } from "redis";
import type { DatabasePool } from "slonik";
import type { Channel, ChannelModel } from "amqplib";
import type { MessageCatalog } from "@infra/message-catalog/message-catalog";
import { createEnvironment } from "@infra/environment/index";

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

export const serverContext = new AsyncLocalStorage<ServerContext>();
