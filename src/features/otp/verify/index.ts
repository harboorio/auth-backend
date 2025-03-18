import { router } from "@infra/router/index";
import { RequestContext } from "@services/http/on/request/context";
import { ServerContext } from "@services/http/context";

router.append({
    name: "OtpVerify",
    method: "PUT",
    pattern: "/otp",
    body: {},
    query: {},
    params: {},
    response: {}, // should we include this in here?
    async handler(requestStore: RequestContext, serverStore: ServerContext) {
        return {};
    },
});
