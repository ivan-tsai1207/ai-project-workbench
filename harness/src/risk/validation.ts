import { canonicalStringify, hashCanonicalValue } from "../core/hash/index.js";
import { validateDocument } from "../schemas/index.js";

export function requireCondition(condition: boolean, reason: string): asserts condition {
  if (!condition) throw new TypeError(reason);
}
export function identifier(value: string): string {
  requireCondition(typeof value === "string", "Invalid identifier type");
  const normalized = value.normalize("NFC").trim();
  requireCondition(normalized.length > 0 && !/[\u0000-\u001f\u007f-\u009f]/u.test(normalized), "Invalid identifier");
  return normalized;
}
export function relativePath(value: string, directory = false): string {
  requireCondition(typeof value === "string", "Invalid path type");
  const normalized = value.normalize("NFC");
  requireCondition(!/[\\:*?\[\]{}\u0000-\u001f\u007f-\u009f]/u.test(normalized), "Unsafe relative path");
  requireCondition(!directory || normalized.endsWith("/"), "Directory prefix required");
  const segments = (directory ? normalized.slice(0, -1) : normalized).split("/");
  requireCondition(segments.every(part => part.length > 0 && part !== "." && part !== ".."), "Unsafe path segments");
  return normalized;
}
export function hashValue(value: unknown): string { return `sha256:${hashCanonicalValue(value)}`; }
export function hashField(value: string): string {
  requireCondition(typeof value === "string" && /^sha256:[0-9a-f]{64}$/.test(value), "Invalid SHA-256 field");
  return value;
}
export function sorted(values: readonly string[], normalize = identifier): string[] {
  requireCondition(Array.isArray(values), "Array required");
  return [...new Set(values.map(normalize))].sort();
}
export function equal(left: unknown, right: unknown): boolean { return canonicalStringify(left) === canonicalStringify(right); }
export function schema(value: unknown): void {
  requireCondition(validateDocument(value).status === "VALID", "Invalid canonical schema");
}
export function verifyHashed(value: Readonly<Record<string, unknown>>, field: string): void {
  const { [field]: supplied, ...payload } = value;
  requireCondition(typeof supplied === "string" && hashField(supplied) === hashValue(payload), "Artifact hash mismatch");
}
