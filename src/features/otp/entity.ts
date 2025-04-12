import { DomainEntity } from "@infra/domain-entity/index";

export class Otp extends DomainEntity {
    rid = "";
    credential_type = "";
    credential = "";
    otp = 0;
    additional_data = {};
    created_at = "";
    updated_at = "";
    removed_at = "";
    origin_rid = "";
    times_tried = 0;

    constructor(obj?: Partial<Otp>) {
        super();

        if (obj) this.init(obj);
    }
}
