import { levels } from "pino";
import build from "pino-abstract-transport";
import SonicBoom from "sonic-boom";
import { once } from "events";

// @ts-ignore
export default async function (opts) {
    // SonicBoom is necessary to avoid loops with the main thread.
    // It is the same of pino.destination().
    const destination = new SonicBoom({ dest: opts?.destination || 1, sync: false });
    await once(destination, "ready");

    return build(
        async function (source) {
            for await (let obj of source) {
                const errmsg = obj.err ? " " + obj.err.message + " " + obj.err.stack : "";
                const toDrain = !destination.write(
                    obj.time + " [" + levels.labels[obj.level].toUpperCase() + "]" + ": " + obj.msg + errmsg + "\n",
                );
                // This block will handle backpressure
                if (toDrain) {
                    await once(destination, "drain");
                }
            }
        },
        {
            async close(_err) {
                destination.end();
                await once(destination, "close");
            },
        },
    );
}
