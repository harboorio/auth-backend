import { router } from "@infra/router/index";

const response = {
    type: "object",
    properties: {
        name: { type: "string" },
        version: { type: "string" },
    },
    required: ["name", "version"],
} as const;

router.append({
    name: "Home",
    method: "GET",
    pattern: "/",
    response: {
        200: response,
    },
    handler: () => ({ name: __PKG_NAME__, version: __PKG_VERSION__ }),
});
