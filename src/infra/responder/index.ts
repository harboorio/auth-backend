import http from "node:http";
import { Buffer } from "node:buffer";

export class Responder {
    req: http.IncomingMessage;
    res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage };
    validRequestOrigins: string[] = [];

    constructor(
        req: http.IncomingMessage,
        res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage },
        validRequestOrigins: string[],
    ) {
        this.req = req;
        this.res = res
            .setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
            .setHeader("Strict-Transport-Security", "max-age=31536000")
            .setHeader("Vary", "Origin,Accept-Language");
        this.validRequestOrigins = validRequestOrigins;

        if (this.req.headers["accept-encoding"]) {
            this.appendToHeader("Vary", "Accept-Encoding");
        }
    }

    appendToHeader(name: string, value: string) {
        this.res.setHeader(name, this.res.getHeader(name) + "," + value);
        return this;
    }

    cors(credentials: boolean, allowedMethods: string[], allowedHeaders: string[], maxAge: number) {
        const origin = this.validRequestOrigins.includes("*")
            ? "*"
            : this.req.headers["origin"] && this.validRequestOrigins.includes(this.req.headers["origin"])
              ? this.req.headers["origin"]
              : this.validRequestOrigins[0];
        this.res.setHeader("Access-Control-Allow-Origin", origin);

        if (credentials) {
            this.res.setHeader("Access-Control-Allow-Credentials", "true");
        }

        if (this.req.method === "OPTIONS") {
            const requestAllowedMethods = this.req.headers["access-control-request-method"];
            if (allowedMethods.length > 0) {
                this.res.setHeader("Access-Control-Allow-Methods", allowedMethods.join(","));
            } else if (requestAllowedMethods) {
                this.res.setHeader("Access-Control-Allow-Methods", requestAllowedMethods);
            }

            const requestAllowedHeaders = this.req.headers["access-control-request-headers"];
            if (allowedHeaders.length > 0) {
                this.res.setHeader("Access-Control-Allow-Headers", allowedHeaders.join(","));
            } else if (requestAllowedHeaders) {
                this.res.setHeader("Access-Control-Allow-Headers", requestAllowedHeaders);
            }

            this.res.setHeader("Access-Control-Max-Age", maxAge);
        }

        return this;
    }

    json(obj: Record<string, unknown> | Record<string, unknown>[], statusCode: number = 200) {
        const str = JSON.stringify(obj);
        const len = this.findContentLength(str);
        this.res.setHeader("Content-Type", "application/json").setHeader("Content-Length", len);
        this.res.statusCode = statusCode;
        this.res.end(str);
    }

    notFound() {
        this.res.statusCode = 404;
        this.res.end();
    }

    findContentLength(input: string) {
        return Buffer.byteLength(input, "utf-8");
    }
}
