import { router } from "@infra/router/index";
import { RequestContext } from "@services/http/on/request/index";
import { ServerContext } from "@src/context";
import { body, response } from "@features/otp/verify/schemas";

router.append({
    name: "OtpVerify",
    method: "PUT",
    pattern: "/otp",
    body,
    response: {
        200: response,
    },
    async handler(requestStore: RequestContext, serverStore: ServerContext) {
        return {};
    },
});
