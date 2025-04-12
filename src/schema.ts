import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import core, { RulesetDefinition } from "@stoplight/spectral-core";
import parsers from "@stoplight/spectral-parsers";
import rulesets from "@stoplight/spectral-rulesets";
import { compile } from "json-schema-to-typescript";
import "@features/index";
import { router } from "@infra/router/index";
import * as os from "node:os";

const typesToCompile: Record<string, unknown> = {};
const schema = {
    openapi: "3.1.0",
    info: {
        title: __PKG_NAME__,
        version: __PKG_VERSION__,
        description: "API schema.",
        contact: {
            name: "Harboor",
            url: "https://harboor.io",
            email: "dock@harboor.io",
        },
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Development server.",
        },
    ],
    paths: router.getRoutes().reduce<Record<string, unknown>>((memo, r) => {
        const method = (r.method as string).toLowerCase();
        const methodTitleCased = method.slice(0, 1).toUpperCase() + method.slice(1);
        const op: Record<string, unknown> = {
            operationId: r.name + methodTitleCased,
            description: "Lorem ipsum",
            tags: ["harboor"],
        };

        if (r.body) {
            op.requestBody = {
                required: true,
                content: {
                    "application/json": {
                        schema: r.body,
                    },
                },
            };
            typesToCompile["HarboorAuth" + r.name + "Body"] = r.body;
        }

        if (r.query) {
            op.requestBody = {
                required: true,
                content: {
                    "application/x-www-form-urlencoded": {
                        schema: r.query,
                    },
                },
            };
            typesToCompile["HarboorAuth" + r.name + "Query"] = r.body;
        }

        if (r.response) {
            op.responses = Object.keys(r.response).reduce<Record<number, unknown>>(
                (memo: Record<number, unknown>, status) => {
                    const _schema = r.response![status as any];

                    memo[status as any] = {
                        description: "",
                        content: {
                            "application/json": {
                                schema: _schema,
                            },
                        },
                    };

                    if (!typesToCompile["HarboorAuth" + r.name + "Response"]) {
                        typesToCompile["HarboorAuth" + r.name + "Response"] = [];
                    }

                    (typesToCompile["HarboorAuth" + r.name + "Response"] as any).push({
                        status,
                        schema: _schema,
                    });

                    return memo;
                },
                {},
            );
        }

        if (!(r.pattern in memo)) memo[r.pattern] = {};
        if (!(method in (memo[r.pattern] as any))) (memo[r.pattern] as any)[method] = {};

        (memo[r.pattern] as any)[method] = op;

        return memo;
    }, {}),
    /*components: {
        schemas: {
            // Include reusable schemas here if needed
        }
    },*/
    tags: [
        {
            name: "harboor",
        },
    ],
};
const text = JSON.stringify(schema, null, 4);
const doc = new core.Document(text, parsers.Json);
const spectral = new core.Spectral();
spectral.setRuleset(rulesets.oas as RulesetDefinition);
const errors = await spectral.run(doc);

if (errors && errors.length > 0) {
    console.log(errors);
    throw new Error("Schema validation failed.");
}

await mkdir(path.resolve(import.meta.dirname, "../schema"), { recursive: true });
await writeFile(path.resolve(import.meta.dirname, "../schema", "openapi.json"), text);

const types = [];
for (const name of Object.keys(typesToCompile)) {
    const _schema = typesToCompile[name] as any;
    if (Array.isArray(_schema)) {
        for (const __schema of _schema) {
            const _type = await compile(__schema.schema, name + __schema.status.toString(), { bannerComment: "" });
            types.push(_type);
        }
        types.push(`export type ${name} = ${_schema.map((__schema) => name + __schema.status.toString()).join(" | ")}`);
    } else {
        const type = await compile(_schema, name, { bannerComment: "" });
        types.push(type);
    }
}

await writeFile(path.resolve(import.meta.dirname, "../schema", "index.d.ts"), types.join(os.EOL + os.EOL));
