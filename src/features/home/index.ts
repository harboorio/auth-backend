import { router } from "@infra/router/index";

router.append({
    name: "Home",
    method: "GET",
    pattern: "/",
    handler: () => ({ message: "hey", version: __PKG_VERSION__ }),
});
