import { customAlphabet } from "nanoid";
import { TracingBase, type TracingAttrs } from "./base";
import { TracingMemory, type TracingSnapshot } from "./memory";
import { TracingSpanEvent } from "./event";

export type TracingSpanConfig = {
    name: string;
    attrs?: TracingAttrs;
    parent?: string | null;
};

export type TracingSpanDependencies = {
    memory: TracingMemory;
    traceSnapshot: TracingSnapshot;
};

export class TracingSpan extends TracingBase {
    private spanIdGen = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 16);
    private id: string;
    private attrs: TracingAttrs | null = null;
    private name: string;
    private parent: string | null = null;
    private children: TracingSpan[] = [];
    private events: TracingSpanEvent[] = [];
    private memory: TracingMemory;
    private trace: TracingSnapshot;
    private prevSnapshot: TracingSnapshot | undefined = undefined;

    constructor(config: TracingSpanConfig, dependencies: TracingSpanDependencies) {
        super();

        this.id = this.genSpanId();
        this.name = config.name;

        if (config.parent) this.parent = config.parent;
        if (config.attrs) this.attrs = config.attrs;

        this.memory = dependencies.memory;
        this.trace = dependencies.traceSnapshot;

        this.memory.add(this.snapshot());
    }

    addEvent(name: string, message: string | null = null, attrs: TracingAttrs | Error | null = null) {
        const ev = new TracingSpanEvent(
            {
                name,
                message,
                attrs:
                    attrs && attrs instanceof Error
                        ? this.objectifyError(attrs)
                        : attrs
                          ? this.redactAttrs(attrs)
                          : null,
            },
            {
                memory: this.memory,
                spanSnapshot: this.prevSnapshot!,
            },
        );
        const len = this.events.push(ev);
        return this.events[len - 1];
    }

    createChild(config: Omit<TracingSpanConfig, "parent">) {
        const span = new TracingSpan(Object.assign({}, config, { parent: this.id }), {
            memory: this.memory,
            traceSnapshot: this.trace,
        });
        const len = this.children.push(span);
        return this.children[len - 1]!;
    }

    private snapshot(): TracingSnapshot {
        const attrs =
            this.env === "node" ? Object.assign({}, this.attrs, this.getNodeResourceUsages()) : (this.attrs ?? {});
        const result: TracingSnapshot = {
            timestamp: this.getTimestamp(),
            traceId: this.trace.traceId,
            traceAttrs: this.trace.traceAttrs,
            projectName: this.trace.projectName,
            serviceName: this.trace.serviceName,
            spanId: this.id,
            spanName: this.name,
            spanAttrs: attrs ? this.redactAttrs(attrs) : null,
            parentSpanId: this.parent,
            eventName: null,
            eventMessage: null,
            eventAttrs: null,
        };

        this.prevSnapshot = result;

        return result;
    }

    end() {
        this.memory.add(this.snapshot());
    }

    private genSpanId() {
        return this.spanIdGen();
    }
}
