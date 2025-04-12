import { msgs } from "@infra/message-catalog/index";
import en from "@infra/message-catalog/messages/en-US.json";
import tr from "@infra/message-catalog/messages/tr-TR.json";
import { workerContext } from "@services/worker/context";
import { establishMqConn } from "@infra/mq/mq";
import { consumers } from "@services/worker/consumers/index";

(async function initWorker() {
    msgs.setup({ "en-US": en, "tr-TR": tr });

    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    const nodeEnv = isDev ? "development" : process.env.NODE_ENV;
    await workerContext.configure(nodeEnv);
    const mqchannels = ["maintenance", "tracing", "notification"];
    const mq = await establishMqConn({
        connStr: workerContext.get().env.get("RABBITMQ_CONN_STR"),
        channels: mqchannels,
    });
    await mq.channel.prefetch(1);

    /*await mq.channel.consume('maintenance', async (msg) => {
        await works.maintenance(msg)
    })

    await mq.channel.consume('tracing', async function(msg) {
        await works.tracing(msg)
    })*/

    await mq.channel.consume("notification", consumers.notification.onMessage);

    process.on("unhandledRejection", (err) => {
        workerContext.get().logger.error(err, "Unhandled rejection.");
        throw err;
    });

    process.on("uncaughtException", (err) => {
        workerContext.get().logger.error(err, "Uncaught exception.");
        throw err;
    });
})();
