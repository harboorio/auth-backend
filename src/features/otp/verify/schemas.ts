export const body = {
    type: "object",
    properties: {
        otp: { type: "string" },
    },
    required: ["otp"],
    additionalProperties: false,
} as const;

export const response = {
    type: "object",
    properties: {
        success: { type: "boolean" },
    },
    required: ["success"],
    additionalProperties: false,
} as const;
