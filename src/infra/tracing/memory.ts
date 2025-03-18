import mitt, { type Emitter } from "mitt";

export type TracingSnapshot = {
    timestamp: Date;
    traceId: string;
    traceAttrs: Record<string, unknown> | null;
    projectName: string | null;
    serviceName: string | null;
    spanId: string | null;
    spanName: string | null;
    spanAttrs: Record<string, unknown> | null;
    parentSpanId: string | null;
    eventName: string | null;
    eventMessage: string | null;
    eventAttrs: Record<string, unknown> | null;
};

export type TracingEvents = {
    trace: TracingSnapshot;
};

export class TracingMemory {
    memo: TracingSnapshot[] = [];
    emitter: Emitter<TracingEvents> | undefined = undefined;
    isClientListeningForEvents = false;
    eventQueue: TracingSnapshot[] = [];

    constructor({ enableEventEmitter }: { enableEventEmitter: boolean }) {
        if (enableEventEmitter) this.emitter = mitt<TracingEvents>();
    }

    add(item: TracingSnapshot) {
        this.memo.push(item);

        if (this.emitter) {
            if (!this.isClientListeningForEvents) this.eventQueue.push(item);
            else this.emitter.emit("trace", item);
        }
    }

    export() {
        return this.memo;
    }

    processQueue() {
        if (this.eventQueue.length > 0 && this.emitter) {
            while (this.eventQueue.length > 0) {
                this.emitter.emit("trace", this.eventQueue.shift()!);
            }
        }
    }
}
