import { DomainStore } from "@infra/domain-store/index";
import { DatabasePool, QuerySqlToken } from "slonik";
import { sql } from "@infra/postgres/postgres";
import { ApplicationError } from "@infra/error-manager/error-manager";
import { Otp } from "@features/otp/entity";

export class OtpStore extends DomainStore {
    pgpool: DatabasePool;

    constructor(pgpool: DatabasePool) {
        super();
        this.pgpool = pgpool;
    }

    async incrementTimesTried(rid: string) {
        try {
            const query = sql.typeAlias("void")`
                UPDATE otp
                SET
                    times_tried = times_tried + 1
                WHERE
                    rid = ${rid}
            `;
            return await this.pgpool.query(query);
        } catch (e) {
            return new ApplicationError("Database update error.", "db", { cause: e });
        }
    }

    async findOne(query: QuerySqlToken) {
        try {
            const result = await this.pgpool.query(query);

            if (result.rowCount === 0) {
                return null;
            }

            if (result.rowCount > 1) {
                return new ApplicationError("Database data integrity error.", "db_integrity");
            }

            return new Otp(result.rows[0]);
        } catch (e) {
            return new ApplicationError("Database query error.", "db", { cause: e });
        }
    }

    async insert(otp: Otp) {
        try {
            return await this.pgpool.query(sql.typeAlias("void")`
                INSERT INTO public.otp
                    (rid, credential_type, credential, otp, additional_data, origin_rid)
                VALUES 
                    (${otp.rid ?? this.genRandomId()}, ${otp.credential_type}, ${otp.credential}, ${otp.otp}, ${otp.additional_data ? sql.jsonb(otp.additional_data) : null}, ${otp.origin_rid})
            `);
        } catch (e) {
            return new ApplicationError("Failed to insert origin.", "db", { cause: e });
        }
    }

    async exists(query: QuerySqlToken) {
        return await this.pgpool.exists(query);
    }
}
