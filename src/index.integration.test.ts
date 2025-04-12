import { test, expect, beforeAll, afterAll } from "vitest";
import { ServerContext, serverContext } from "@src/context";
import { initServer } from "@services/http/index";
import { Origin, OriginStore } from "@features/origin/index";
import supertest from "supertest";

let context: ServerContext | null = null;
let app = null;

beforeAll(async () => {
    await serverContext.configure("test");
    context = serverContext.get();
    app = await initServer();

    const store = new OriginStore(context.pgpool);
    await store.insert(
        new Origin({
            rid: "test1",
            name: "test",
            addresses: ["http://localhost"],
        }),
    );
});

afterAll(async () => {
    const store = new OriginStore(context!.pgpool);
    await store.remove("test1");

    context = null;
    app = null;
});

// it auto-creates the origin in dev mode
test.skip("origins", async () => {
    const payload = {
        credentialType: "email",
        credential: "test@test.com",
    };
    const response = await supertest(app!).post("/otp").set("Origin", "https://invalid.io").send(payload);
    expect(response.body).toMatchObject({ error: { code: "app_auth" } });

    const response2 = await supertest(app!).post("/otp").set("Origin", "http://localhost").send(payload);
    expect(response2.body).toMatchObject({ success: true });
});

test("otp request", async () => {
    const response = await supertest(app!).post("/otp").set("Origin", "http://localhost").send({ invalid: "payload" });
    expect(response.body).toMatchObject({ error: { code: "schema_validation" } });

    const response2 = await supertest(app!).post("/otp").set("Origin", "http://localhost").send({
        credentialType: "email",
        credential: "test@test.com",
    });
    expect(response2.body).toMatchObject({ success: true });
});
