import { serverContext } from "@services/http/context";

export default function onDropRequest() {
    const serverStore = serverContext.getStore()!;
    serverStore.logger.error("Dropped a request. Check server.maxRequestsPerSocket.");
}
