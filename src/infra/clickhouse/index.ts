import { createClient } from "@clickhouse/client";

export async function establishClickhouseConn({ connStr }: { connStr: string }) {
    return createClient({
        url: connStr,
        username: "default",
    });
}
