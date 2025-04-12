import { JSONSchema } from "json-schema-to-ts";
import { type CountryCode } from "libphonenumber-js/max";

/*export const body = {
    type: 'object',
    properties: {
        credentialType: {
            enum: ['email', 'phone']
        },
        credential: {
            type: 'string'
        }
    },
    required: ['credentialType', 'credential'],
} as const*/

export const response = {
    type: "object",
    properties: {
        success: { type: "boolean" },
    },
    required: ["success"],
    additionalProperties: false,
} as const;

export const body = {
    type: "object",
    properties: {
        credentialType: { enum: ["email", "phone"] },
        credential: {
            oneOf: [
                { type: "string", format: "email" },
                {
                    type: "object",
                    properties: {
                        country: { type: "string", format: "country_code" },
                        num: { type: "string" },
                    },
                    required: ["country", "num"],
                    additionalProperties: false,
                },
            ],
        },
    },
    required: ["credentialType", "credential"],
    if: {
        properties: {
            credentialType: { const: "email" },
        },
    },
    then: {
        properties: {
            credential: { type: "string", format: "email" },
        },
    },
    else: {
        properties: {
            credential: {
                type: "object",
                properties: {
                    country: { type: "string", format: "country_code" },
                    num: { type: "string" },
                },
                required: ["country", "num"],
                additionalProperties: false,
            },
        },
    },
    additionalProperties: false,
} as const satisfies JSONSchema;

type CredentialEmail = {
    credentialType: "email";
    credential: string;
};
type CredentialPhone = {
    credentialType: "phone";
    credential: {
        country: CountryCode;
        num: string;
    };
};
export type CredentialInput = CredentialEmail | CredentialPhone;
