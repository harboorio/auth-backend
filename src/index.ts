import { fetchSecretsAws } from "@harboor/core";
import { initServer } from "@services/http/index";
import { createEnvironment } from "@infra/environment/index";

(async function initApp() {
    const secrets =
        process.env.NODE_ENV === "development"
            ? process.env
            : await fetchSecretsAws({
                  aws: {
                      secretName: "prod/harboor/auth",
                      credentials: {
                          region: process.env.AWS_REGION,
                          accessKey: process.env.AWS_ACCESS_KEY,
                          accessKeySecret: process.env.AWS_ACCESS_KEY_SECRET,
                      },
                  },
              });
    const env = createEnvironment(secrets);
    await initServer(env);
})();
