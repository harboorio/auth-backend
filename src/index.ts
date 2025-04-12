import { initServer } from "@services/http/index";
import { msgs } from "@infra/message-catalog/index";
import en from "@infra/message-catalog/messages/en-US.json";
import tr from "@infra/message-catalog/messages/tr-TR.json";
import { serverContext } from "@src/context";

(async function initApp() {
    msgs.setup({ "en-US": en, "tr-TR": tr });

    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    const nodeEnv = isDev ? "development" : process.env.NODE_ENV;
    await serverContext.configure(nodeEnv);
    const server = await initServer();

    server.listen(3000, "0.0.0.0", () => {
        serverContext.get().logger.info("Server (:3000) is online.");
    });

    process.on("unhandledRejection", (err) => {
        serverContext.get().logger.error(err, "Unhandled rejection.");
        throw err;
    });

    process.on("uncaughtException", (err) => {
        serverContext.get().logger.error(err, "Uncaught exception.");
        throw err;
    });
})();
