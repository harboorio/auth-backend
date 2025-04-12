import { parsePhoneNumber } from "libphonenumber-js/max";
import { router } from "@infra/router/index";
import { body, type CredentialInput, response } from "@features/otp/request/schemas";
import { OtpService } from "@features/otp/service";
import { OtpStore } from "@features/otp/store";
import { ApplicationError, ApplicationHttpError, applicationHttpErrorSchema } from "@infra/error-manager/error-manager";
import { Otp } from "@features/otp/entity";
import { createJobData } from "@infra/mq/mq";

router.append({
    name: "OtpRequest",
    method: "POST",
    pattern: "/otp",
    body: body,
    //query: {},
    //params: {},
    response: {
        400: applicationHttpErrorSchema,
        200: response,
    },
    async handler(req, server) {
        const body = req.body as CredentialInput;
        const credential =
            body.credentialType === "email"
                ? body.credential
                : parsePhoneNumber(body.credential.num, body.credential.country).number;
        const service = new OtpService(new OtpStore(server.pgpool), server);
        const otp = await service.verifyOtpRequest(
            new Otp({
                credential,
                credential_type: body.credentialType,
                origin_rid: req.origin.rid,
                additional_data: body.credentialType === "phone" ? { country: body.credential.country } : undefined,
            }),
        );

        if (otp instanceof ApplicationError) {
            return new ApplicationHttpError(req.t(""), "", 400);
        }

        const data = createJobData("otp-request", otp);
        server.mq.channel.sendToQueue("notification", data, { persistent: true });

        return { success: true };
    },
});
