import { TracingBase } from "./base";
import { TracingMemory, type TracingSnapshot } from "./memory";

export type TracingSpanEventConfig = {
    name: string;
    message: string | null;
    attrs: Record<string, unknown> | null;
};

export type TracingSpanEventDependencies = {
    memory: TracingMemory;
    spanSnapshot: TracingSnapshot;
};

export class TracingSpanEvent extends TracingBase {
    private name: string;
    private message: string | null;
    private attrs: Record<string, unknown> | undefined;
    private memory: TracingMemory;
    private span: TracingSnapshot;

    constructor(config: TracingSpanEventConfig, dependencies: TracingSpanEventDependencies) {
        super();

        this.name = config.name;
        this.message = config.message;

        if (config.attrs) this.attrs = config.attrs;

        this.memory = dependencies.memory;
        this.span = dependencies.spanSnapshot;

        this.memory.add(this.snapshot());
    }

    private snapshot(): TracingSnapshot {
        const attrs =
            this.env === "node" ? Object.assign({}, this.attrs, this.getNodeResourceUsages()) : (this.attrs ?? {});
        return {
            timestamp: this.getTimestamp(),
            traceId: this.span.traceId,
            traceAttrs: this.span.traceAttrs,
            projectName: this.span.projectName,
            serviceName: this.span.serviceName,
            spanId: this.span.spanId!,
            spanName: this.span.spanName!,
            spanAttrs: this.span.spanAttrs,
            parentSpanId: this.span.parentSpanId,
            eventName: this.name,
            eventMessage: this.message,
            eventAttrs: attrs ? this.redactAttrs(attrs) : null,
        };
    }
}
