import { createPool } from "slonik";

export async function establishPostgresConn({ connStr }: { connStr: string }) {
    return await createPool(connStr, {
        typeParsers: [],
    });
}
