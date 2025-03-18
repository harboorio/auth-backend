import amqp from "amqplib";

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
