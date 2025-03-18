import { expect, test, vi } from "vitest";
import { Tracing } from "./tracing";

test("tracing", () => {
    const tracing = new Tracing({
        serviceName: "test",
        projectName: "project",
        attrs: { abc: 1 },
    });
    const result = tracing.export();
    expect(result[0]!.projectName).toBe("project");
    expect(result[0]!.serviceName).toBe("test");
    expect(result[0]!.traceAttrs).toMatchObject({ abc: 1 });

    const rootSpan = tracing.createRootSpan({ name: "hello", attrs: { someId: 123 } });
    const result2 = tracing.export();
    expect(result2[1]!.projectName).toBe("project");
    expect(result2[1]!.spanName).toBe("hello");
    expect(result2[1]!.spanAttrs).toMatchObject({ someId: 123 });

    const encryptSpan = rootSpan.createChild({ name: "encrypt" });
    encryptSpan.addEvent("encrypt", "some message", { key: "abc123" });
    encryptSpan.addEvent("saved", "another message", { key: "def456" });
    const result3 = tracing.export();
    expect(result3[2]!.spanName).toBe("encrypt");
    expect(result3[3]!.eventName).toBe("encrypt");
    expect(result3[3]!.eventMessage).toBe("some message");
    expect(result3[3]!.eventAttrs).toMatchObject({ key: "abc123" });
    expect(result3[4]!.eventName).toBe("saved");
    expect(result3[4]!.eventMessage).toBe("another message");
    expect(result3[4]!.eventAttrs).toMatchObject({ key: "def456" });
});

test("tracing events", () => {
    const tracing = new Tracing({
        serviceName: "test",
        projectName: "project",
        attrs: { abc: 1 },
        listen: true,
    });
    function onTrace() {}
    const mock = vi.fn().mockImplementation(onTrace);
    tracing.on("trace", mock);
    expect(mock).toHaveBeenCalledTimes(1);

    const rootSpan = tracing.createRootSpan({ name: "hello", attrs: { someId: 123 } });
    expect(mock).toHaveBeenCalledTimes(2);

    const encryptSpan = rootSpan.createChild({ name: "encrypt" });
    encryptSpan.addEvent("encrypt", "some message", { key: "abc123" });
    encryptSpan.addEvent("saved", "another message", { key: "def456" });
    expect(mock).toHaveBeenCalledTimes(5);
});
