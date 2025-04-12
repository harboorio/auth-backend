import amqp, { ConsumeMessage } from "amqplib";
import { DomainEntity } from "@infra/domain-entity/index";

export async function establishMqConn({ connStr, channels }: { connStr: string; channels: string[] }) {
    const conn = await amqp.connect(connStr);
    const channel = await conn.createChannel();

    for await (const name of channels) {
        await channel.assertQueue(name, { durable: true });
    }

    process.on("SIGINT", async () => {
        await conn.close();
    });

    return {
        conn,
        channel,
    };
}

export function createJobData(name: string, data: DomainEntity | object) {
    const obj = data instanceof DomainEntity ? data.toObject() : data;
    const serialized = JSON.stringify({ name, payload: obj });
    return Buffer.from(serialized);
}

export function readJobData(msg: ConsumeMessage | null): Error | { name: string; payload: Record<string, unknown> } {
    if (!msg) return new Error("Empty message.");

    try {
        const obj = JSON.parse(msg.content.toString());

        if ("name" in obj && "payload" in obj) {
            return obj;
        }

        return new Error("Invalid message.");
    } catch (e) {
        return e as Error;
    }
}
