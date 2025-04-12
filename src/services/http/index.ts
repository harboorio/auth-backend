import * as http from "node:http";
import { onClientError, onDropRequest, onRequest } from "@services/http/on/index";
import "@features/index";
import { router } from "@infra/router/index";

export async function initServer() {
    router.lock();

    const server = http.createServer({
        keepAliveTimeout: 30000,
        requestTimeout: 30000,
    });

    server.on("request", onRequest);
    server.on("dropRequest", onDropRequest);
    server.on("clientError", onClientError);

    return server;
}
