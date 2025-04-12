import postmark from "postmark";

export type EmailGatewayName = "postmark";
export type EmailGatewaySendConfig = {
    from: string;
    subject: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    html?: string;
    text?: string;
    attachments?: EmailGatewaySendAttachment[];
};
export type EmailGatewaySendAttachment = {
    filename: string;
    type: string;
    content: string;
};
export type EmailGatewaySendResult = { id: string } | { error: { code: string | number; message?: string } };
export type EmailGatewayService = {
    name: EmailGatewayName;
    send: (config: EmailGatewaySendConfig) => Promise<EmailGatewaySendResult>;
    [index: string]: unknown;
};
export type EmailGatewayConfig = EmailGatewayConfigPostmark;

export type EmailGatewayConfigPostmark = {
    serverToken: string;
};

export class EmailGateway {
    private service: EmailGatewayService;
    private config: EmailGatewayConfig;

    constructor(service: EmailGatewayName, config: EmailGatewayConfig) {
        this.service = {
            name: service,
            async send(_config) {
                return { error: { code: "no_service" } };
            },
        };
        this.config = config;
    }

    async send(config: EmailGatewaySendConfig) {
        await this.service["send"].call(this, config);
    }

    async init() {
        if (this.service.name === "postmark") {
            this.service["client"] = new postmark.ServerClient(this.config.serverToken);
            this.service["send"] = async function postmarkSend(this: EmailGateway, config: EmailGatewaySendConfig) {
                const propMapping: Record<keyof EmailGatewaySendConfig, keyof postmark.Models.Message> = {
                    to: "To",
                    from: "From",
                    subject: "Subject",
                    cc: "Cc",
                    bcc: "Bcc",
                    html: "HtmlBody",
                    text: "TextBody",
                    attachments: "Attachments",
                };
                const payload: postmark.Models.Message = {
                    From: config.from,
                    Subject: config.subject,
                };

                setMailboxField("to");
                setMailboxField("cc");
                setMailboxField("bcc");

                if (config.html) payload.HtmlBody = config.html;
                if (config.text) payload.TextBody = config.text;

                if (!config.html && config.text) {
                    throw new Error('Both "html" and "text" contents are missing.');
                }

                if (config.attachments) {
                    payload.Attachments = config.attachments.map((a) => {
                        return {
                            Name: a.filename,
                            ContentType: a.type,
                            Content: a.content,
                            ContentID: a.filename,
                        };
                    });
                }

                const result = await (this.service["client"] as postmark.ServerClient).sendEmail(payload);

                if (result.ErrorCode > 0) {
                    return {
                        error: {
                            code: result.ErrorCode,
                            message: result.Message,
                        },
                    };
                }

                return {
                    id: result.MessageID,
                };

                function setMailboxField(prop: keyof EmailGatewaySendConfig) {
                    const _prop = propMapping[prop];
                    if (typeof config[prop] === "string") payload[_prop as "To"] = config[prop];
                    else if (Array.isArray(config[prop])) payload[_prop as "To"] = config[prop].join(",");
                    else throw new Error('The "' + prop + '" can either be string or string[].');
                }
            };
        }
    }
}
