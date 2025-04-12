import { z } from "zod";

export const json = {
    type: "object",
    properties: {
        rid: { type: "string" },
        name: { type: "string" },
        addresses: {
            type: "array",
            items: { type: "string" },
        },
        created_at: { type: "string" },
        updated_at: { type: "string" },
        removed_at: { type: "string" },
    },
    required: ["rid", "name", "addresses", "created_at", "updated_at"],
};

export const zod = z
    .object({
        rid: z.string(),
        name: z.string(),
        addresses: z.array(z.string()),
        created_at: z.string(),
        updated_at: z.string(),
        removed_at: z.string(),
        business_data: z.object({
            name: z.string(),
            address: z.string(),
            website: z.string(),
            logo: z.object({
                url: z.string(),
                width: z.number(),
                height: z.number(),
            }),
        }),
    })
    .strict();
