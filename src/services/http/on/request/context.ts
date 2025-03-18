import { AsyncLocalStorage } from "node:async_hooks";
import { getTranslationFunction } from "@infra/message-catalog/index";
import { Tracing } from "@infra/tracing/tracing";
import { Logger } from "pino";
import { Token } from "auth-header";

export interface RequestContext {
    t: ReturnType<typeof getTranslationFunction>;
    url: URL;
    body: { [p: string]: string } | null;
    params: Record<string, string> | null;
    tracing: Tracing;
    logger: Logger;
    userAddrs: string[];
    userAuthData: Token;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
