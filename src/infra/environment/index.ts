export interface Environment {
    RABBITMQ_ERLANG_COOKIE: string;
    RABBITMQ_USER: string;
    RABBITMQ_PASS: string;
    RABBITMQ_VHOST: string;
    POSTGRES_PASSWORD: string;
    POSTGRES_DB: string;
    NODE_ENV: string;
    HOST: string;
    APP_LOG_LEVEL: string;
    APP_REQUEST_ORIGINS: string;
    APP_JWT_SECRET: string;
    APP_JWT_ISSUER: string;
    REDIS_PASSWORD: string;
    REDIS_CONN_STR: string;
    POSTGRES_CONN_STR: string;
    RABBITMQ_CONN_STR: string;
    PUBLIC_PORT: string;
}

export class EnvironmentMap extends Map<keyof Environment, Environment[keyof Environment]> {
    override get(k: keyof Environment): string {
        return this.get(k) as string;
    }
}

export function createEnvironment(obj: Record<keyof Environment, Environment[keyof Environment]>) {
    const env = new Map<keyof Environment, Environment[keyof Environment]>() as EnvironmentMap;

    Object.keys(obj).map((k) => env.set(k as any, obj[k as keyof typeof obj]));

    return env;
}
