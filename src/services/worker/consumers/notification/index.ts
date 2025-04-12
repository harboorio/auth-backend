import { ConsumeMessage } from "amqplib";
import { readJobData } from "@infra/mq/mq";

async function onMessage(msg: ConsumeMessage | null) {
    const obj = readJobData(msg);
    if (obj instanceof Error) return obj;

    switch (obj.name) {
        case "otp-request":
            console.log(obj);
            break;
    }
}

export const notification = {
    onMessage,
};
