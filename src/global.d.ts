declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: string;
            HOST: string;
            AWS_REGION: string;
            AWS_ACCESS_KEY: string;
            AWS_ACCESS_KEY_SECRET: string;
        }
    }

    const __PKG_NAME__: string;
    const __PKG_VERSION__: string;
}

export {};
