import { customAlphabet } from "nanoid";
import { TracingBase, type TracingAttrs } from "./base";
import { TracingSpan, type TracingSpanConfig } from "./span";
import { TracingMemory, type TracingSnapshot } from "./memory";

export type TracingConfig = {
    projectName?: string;
    serviceName?: string;
    attrs?: TracingAttrs;
    redact?: string[];
    listen?: boolean;
};

export class Tracing extends TracingBase {
    private traceIdGen = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 32);
    private id: string;
    private projectName: string | null;
    private serviceName: string | null;
    private attrs: TracingAttrs | null = null;
    // list of property names that will be redacted during export
    private redact: string[] = [];
    // short-term memory of trace data
    private memory: TracingMemory;
    private prevSnapshot: TracingSnapshot | undefined = undefined;
    private rootSpan: TracingSpan | undefined = undefined;

    constructor(config: TracingConfig) {
        super();

        this.memory = new TracingMemory({ enableEventEmitter: !!config.listen });
        this.id = this.genTraceId();

        if (config.attrs) this.attrs = config.attrs;
        this.projectName = config.projectName ? config.projectName : null;
        this.serviceName = config.serviceName ? config.serviceName : null;

        this.memory.add(this.snapshot());
    }

    getId() {
        return this.id;
    }

    on(eventName: "trace", fn: ((snapshot: TracingSnapshot) => void) | ((snapshot: TracingSnapshot) => Promise<void>)) {
        if (this.memory.emitter) {
            this.memory.emitter.on(eventName, fn);

            if (!this.memory.isClientListeningForEvents) {
                this.memory.isClientListeningForEvents = true;
                this.memory.processQueue();
            }
        }
    }

    createRootSpan(config: Omit<TracingSpanConfig, "parent">) {
        this.rootSpan = new TracingSpan(config, {
            memory: this.memory,
            traceSnapshot: this.prevSnapshot!,
        });
        return this.rootSpan;
    }

    getRootSpan() {
        return this.rootSpan!;
    }

    end() {
        this.memory.add(this.snapshot());
    }

    export() {
        return this.memory.export();
    }

    private snapshot(): TracingSnapshot {
        const attrs =
            this.env === "node" ? Object.assign({}, this.attrs, this.getNodeResourceUsages()) : (this.attrs ?? {});
        const result: TracingSnapshot = {
            timestamp: this.getTimestamp(),
            traceId: this.id,
            traceAttrs: attrs ? this.redactAttrs(attrs, this.redact) : null,
            projectName: this.projectName,
            serviceName: this.serviceName,
            spanId: null,
            spanName: null,
            spanAttrs: null,
            parentSpanId: null,
            eventName: null,
            eventMessage: null,
            eventAttrs: null,
        };

        this.prevSnapshot = result;

        return result;
    }

    private genTraceId() {
        return this.traceIdGen();
    }
}
