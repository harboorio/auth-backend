import { customAlphabet } from "nanoid";
import { ServerContext } from "@src/context";
import { OtpStore } from "@features/otp/store";
import { sql } from "@infra/postgres/postgres";
import { Otp } from "@features/otp/entity";

export class OtpService {
    store: OtpStore;
    server: ServerContext;

    constructor(store: OtpStore, server: ServerContext) {
        this.store = store;
        this.server = server;
    }

    async verifyOtpRequest(otp: Otp) {
        const query = sql.typeAlias("otp")`
            SELECT *
            FROM otp
            WHERE
                origin_rid = ${otp.origin_rid} AND
                removed_at IS NULL AND
                credential = ${otp.credential}
        `;
        const rec = await this.store.findOne(query);

        if (rec instanceof Error) {
            return rec;
        }

        if (rec !== null) {
            return rec;
        }

        otp.otp = this.genOtpNumber();
        otp.rid = this.store.genRandomId();

        const result = await this.store.insert(otp);
        if (result instanceof Error) return result;

        return otp;
    }

    genOtpNumber() {
        const n1 = parseFloat(customAlphabet("123456789", 1)()) * 100000;
        const n2 = parseFloat(customAlphabet("0123456789", 5)());
        return n1 + n2;
    }
}
