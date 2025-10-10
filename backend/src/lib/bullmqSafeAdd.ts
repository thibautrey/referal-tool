import { Queue, JobsOptions, BulkJobOptions } from "bullmq";
import { IncomingMessage, ServerResponse } from "http";
import { Readable } from "stream";

const BLOCKED_KEYS = new Set([
  "req",
  "res",
  "socket",
  "connection",
  "response",
  "request",
]);

const BLOCKED_CONSTRUCTOR_NAMES = new Set([
  "ClientRequest",
  "IncomingMessage",
  "ServerResponse",
  "Socket",
  "TLSSocket",
]);

const BLOCKED_INSTANCE_CHECKS = [
  (value: unknown): value is IncomingMessage => value instanceof IncomingMessage,
  (value: unknown): value is ServerResponse => value instanceof ServerResponse,
  (value: unknown): value is Readable => value instanceof Readable,
];

function isBlockedInstance(value: unknown): boolean {
  return BLOCKED_INSTANCE_CHECKS.some((check) => {
    try {
      return check(value);
    } catch {
      return false;
    }
  });
}

function isPlainObject(value: any): value is Record<string, unknown> {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function sanitizePrimitive(value: unknown) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof URL) {
    return value.toString();
  }
  if (value instanceof RegExp) {
    return value.toString();
  }
  if (Buffer.isBuffer(value)) {
    return value.toString("base64");
  }
  return value;
}

function sanitizeError(error: Error, seen: WeakSet<object>) {
  const base: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  if (error.stack) {
    base.stack = error.stack;
  }

  const asAny = error as Record<string, unknown>;
  for (const [key, value] of Object.entries(asAny)) {
    if (typeof value === "function" || value === undefined) continue;
    const sanitized = sanitizeForQueue(value, seen);
    if (sanitized !== undefined) {
      base[key] = sanitized;
    }
  }

  return base;
}

export function sanitizeForQueue(
  value: unknown,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (value === null || typeof value !== "object") {
    return sanitizePrimitive(value);
  }

  if (value instanceof Error) {
    return sanitizeError(value, seen);
  }

  if (isBlockedInstance(value)) {
    return undefined;
  }

  if (seen.has(value)) {
    return undefined;
  }

  seen.add(value as object);

  if (Array.isArray(value)) {
    const sanitizedArray = value
      .map((item) => sanitizeForQueue(item, seen))
      .filter((item) => item !== undefined);
    seen.delete(value as object);
    return sanitizedArray;
  }

  if (value instanceof Map) {
    const sanitizedMap: Record<string, unknown> = {};
    for (const [key, mapValue] of value.entries()) {
      const sanitized = sanitizeForQueue(mapValue, seen);
      if (sanitized !== undefined) {
        sanitizedMap[String(key)] = sanitized;
      }
    }
    seen.delete(value as object);
    return sanitizedMap;
  }

  if (value instanceof Set) {
    const sanitizedSet = Array.from(value)
      .map((item) => sanitizeForQueue(item, seen))
      .filter((item) => item !== undefined);
    seen.delete(value as object);
    return sanitizedSet;
  }

  const constructorName = (value as { constructor?: { name?: string } })
    .constructor?.name;
  if (constructorName && BLOCKED_CONSTRUCTOR_NAMES.has(constructorName)) {
    return undefined;
  }

  const result: Record<string, unknown> = {};

  if (!isPlainObject(value)) {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (BLOCKED_KEYS.has(key)) {
        continue;
      }
      const sanitized = sanitizeForQueue(
        (value as Record<string, unknown>)[key],
        seen
      );
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    }
    seen.delete(value as object);
    return result;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (BLOCKED_KEYS.has(key)) {
      continue;
    }
    if (typeof entry === "function" || entry === undefined) {
      continue;
    }

    const sanitized = sanitizeForQueue(entry, seen);
    if (sanitized !== undefined) {
      result[key] = sanitized;
    }
  }

  seen.delete(value as object);
  return result;
}

const originalAdd = Queue.prototype.add;
Queue.prototype.add = function <T = any>(
  this: Queue<T>,
  name: string,
  data: T,
  opts?: JobsOptions
) {
  const sanitized = sanitizeForQueue(data) as T;
  return originalAdd.call(this, name, sanitized, opts);
};

const originalAddBulk = Queue.prototype.addBulk;
Queue.prototype.addBulk = function <T = any>(
  this: Queue<T>,
  jobs: BulkJobOptions<T>[]
) {
  const sanitizedJobs = jobs.map((job) => ({
    ...job,
    data: sanitizeForQueue(job.data) as T,
  }));
  return originalAddBulk.call(this, sanitizedJobs);
};

export {}; // Ensure this module is treated as a module for side effects
