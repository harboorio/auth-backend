import { createPool, createSqlTag } from "slonik";
import { z } from "zod";
import * as origin from "@features/origin/schemas";
import * as otp from "@features/otp/schemas";

export async function establishPostgresConn({ connStr }: { connStr: string }) {
    return await createPool(connStr, {
        typeParsers: [],
    });
}

export const sql = createSqlTag({
    typeAliases: {
        void: z.object({}).strict(),
        origin: origin.zod,
        otp: otp.zod,
    },
});
