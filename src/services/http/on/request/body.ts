import http from "node:http";
import type { ServerContext } from "@src/context";
import { getTranslationFunction } from "@infra/message-catalog/index";
import { Buffer } from "node:buffer";
import { ApplicationHttpError } from "@infra/error-manager/error-manager";
import { HTTP_REQUEST_MAX_BODY_SIZE } from "@src/config";

export async function readBody(
    req: http.IncomingMessage,
    { logger }: ServerContext,
    t: ReturnType<typeof getTranslationFunction>,
): Promise<{ data: Buffer | null; size: number; err: ApplicationHttpError | null }> {
    return new Promise((resolve, reject) => {
        if (req.method !== "POST" && req.method !== "PUT") {
            return resolve({ data: null, size: 0, err: null });
        }

        let cleaned = false;
        let received = 0;
        let chunks: Buffer<ArrayBufferLike>[] = [];

        req.on("error", onError);
        req.on("aborted", onAborted);
        req.on("data", onData);
        req.on("end", onEnd);
        req.on("close", onClose);

        function close(result: Buffer | ApplicationHttpError | null) {
            resolve({
                data: result instanceof ApplicationHttpError ? null : result,
                size: received,
                err: result instanceof ApplicationHttpError ? result : null,
            });
            return cleanup();
        }

        function cleanup() {
            if (cleaned) return;

            cleaned = true;
            received = 0;
            chunks = [];

            req.removeListener("error", onError);
            req.removeListener("aborted", onAborted);
            req.removeListener("data", onData);
            req.removeListener("end", onEnd);
            req.removeListener("close", onClose);
        }

        function onClose() {
            cleanup();
        }

        function onEnd() {
            return close(Buffer.concat(chunks));
        }

        function onData(chunk: Buffer) {
            received += chunk.length;

            if (received > HTTP_REQUEST_MAX_BODY_SIZE) {
                logger.info("Max request body size exceeded.");
                return close(new ApplicationHttpError(t("error_bad_request"), "request_body_size", 413));
            }

            chunks.push(chunk);
        }

        function onError(err: Error) {
            const _err = new ApplicationHttpError(t("error_unexpected"), "request_stream_read", 422, { cause: err });
            logger.warn(_err, "Failed to read the request stream.");
            return close(_err);
        }

        function onAborted() {
            const _err = new ApplicationHttpError(t("error_request_canceled"), "request_aborted", 400);
            return close(_err);
        }
    });
}
