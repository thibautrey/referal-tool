import { sanitizeForQueue } from "../../src/lib/bullmqSafeAdd";

describe("sanitizeForQueue", () => {
  it("removes circular references from nested structures", () => {
    const circular: any = { foo: "bar" };
    circular.self = circular;

    const result = sanitizeForQueue(circular) as Record<string, unknown>;

    expect(result).toEqual({ foo: "bar" });
    expect((result as any).self).toBeUndefined();
  });

  it("strips express request/response properties", () => {
    const payload = {
      req: { headers: { host: "example.com" } },
      res: {},
      data: { value: 42 },
    };

    const result = sanitizeForQueue(payload) as Record<string, unknown>;

    expect(result).toEqual({ data: { value: 42 } });
  });

  it("serializes errors with additional metadata", () => {
    const error = new Error("boom");
    (error as any).status = 500;
    (error as any).details = { foo: "bar" };

    const result = sanitizeForQueue(error) as Record<string, unknown>;

    expect(result).toMatchObject({
      name: "Error",
      message: "boom",
      status: 500,
      details: { foo: "bar" },
    });
    expect(result.stack).toEqual(error.stack);
  });
});
