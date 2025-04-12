import { DatabasePool, QuerySqlToken } from "slonik";
import { sql } from "@infra/postgres/postgres";
import { ApplicationError } from "@infra/error-manager/error-manager";
import { ServerContext } from "@src/context";
import { DomainStore } from "@infra/domain-store/index";
import { DomainEntity } from "@infra/domain-entity/index";

type Business = {
    name: string;
    address: string;
    website: string;
    logo: {
        url: string;
        width: number;
        height: number;
    };
};

export class Origin extends DomainEntity {
    rid: string = "";
    name: string = "";
    addresses: string[] = [];
    created_at: string = "";
    updated_at: string = "";
    removed_at: string = "";
    business_data: Business | null = null;

    constructor(obj?: Partial<Origin>) {
        super();

        if (obj) this.init(obj);
    }
}

export class OriginStore extends DomainStore {
    pgpool: DatabasePool;

    constructor(pgpool: DatabasePool) {
        super();
        this.pgpool = pgpool;
    }

    async exists(rid: string) {
        return await this.pgpool.exists(sql.typeAlias("void")`
            SELECT rid
            FROM public.origin
            WHERE rid = ${rid}
        `);
    }

    async findByRid(rid: string) {
        return await this.findOne(sql.typeAlias("origin")`
            SELECT *
            FROM public.origin
            WHERE rid = ${rid}
        `);
    }

    async findByOrigin(host: string) {
        return await this.findOne(sql.typeAlias("origin")`
            SELECT * FROM public.origin
            WHERE
                ${host} = ANY (addresses) AND
                removed_at IS NOT NULL
        `);
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

            return new Origin(result.rows[0]);
        } catch (e) {
            return new ApplicationError("Database query error.", "db", { cause: e });
        }
    }

    async insert(origin: Origin) {
        try {
            return await this.pgpool.query(sql.typeAlias("void")`
                INSERT INTO public.origin 
                    (
                     rid,
                     name,
                     addresses,
                     business_data
                    )
                VALUES 
                    (
                     ${origin.rid ?? this.genRandomId()},
                     ${origin.name},
                     ${sql.array(origin.addresses, "text")},
                     ${origin.business_data ? sql.jsonb(origin.business_data) : null}
                    )
            `);
        } catch (e) {
            return new ApplicationError("Failed to insert origin.", "db", { cause: e });
        }
    }

    async remove(rid: string) {
        try {
            return await this.pgpool.query(sql.typeAlias("void")`
                UPDATE
                    public.origin
                SET
                    updated_at = DEFAULT,
                    removed_at = now()
                WHERE
                    rid = ${rid}
            `);
        } catch (e) {
            return new ApplicationError("Failed to remove origin.", "db", { cause: e });
        }
    }
}

export class OriginService {
    store: OriginStore;
    server: ServerContext;

    constructor(store: OriginStore, server: ServerContext) {
        this.store = store;
        this.server = server;
    }

    async findByOrigin(host: string | undefined) {
        if (!host) {
            return null;
        }

        const result = await this.store.findByOrigin(host);

        if (result instanceof ApplicationError) {
            // TODO log error
            return null;
        }

        return result;
    }

    async fakeOrigin(origin: string) {
        const rid = "fake";
        const exists = await this.store.exists(rid);

        if (exists) return await this.store.findByRid(rid);
        else {
            const _origin = new Origin({
                rid,
                name: rid,
                addresses: [origin],
            });
            await this.store.insert(new Origin(_origin));
            return _origin;
        }
    }
}
