import { z } from "zod";

export const zod = z
    .object({
        rid: z.string(),
        credential_type: z.string(),
        credential: z.string(),
        otp: z.string(),
        additional_data: z.object({}).passthrough(),
        created_at: z.string(),
        updated_at: z.string(),
        removed_at: z.string(),
        origin_rid: z.string(),
        times_tried: z.number(),
    })
    .strict();
