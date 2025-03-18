export default function onClientError(err: NodeJS.ErrnoException, socket: NodeJS.WritableStream) {
    if (err.code === "ECONNRESET" || !socket.writable) {
        return;
    }

    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
}
