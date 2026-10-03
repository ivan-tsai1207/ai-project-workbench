import assert from "node:assert/strict";
import test from "node:test";
import uri from "fast-uri";

test("GHSA-qw65-cvwx-89v3: malformed port cannot inject an authority", () => {
  const components = {
    scheme: "http",
    host: "trusted.example",
    port: "@127.0.0.1:8124",
    path: "/app",
  };
  assert.throws(() => uri.serialize(components), /URI port is malformed\./);
  assert.throws(() => uri.normalize(components), /URI port is malformed\./);
  assert.equal(uri.equal(components, "http://127.0.0.1:8124/app"), false);
});

test("GHSA-58mr-gqgx-xq4g: malformed bracket host reports an error", () => {
  const malformed = "http://user@[@127.0.0.1/app";
  assert.equal(uri.parse(malformed).error, "URI host is malformed.");
  assert.equal(uri.normalize(malformed), malformed);
  assert.equal(uri.equal(malformed, malformed), false);
  assert.throws(() => uri.resolve("http://trusted.example/", malformed), /URI host is malformed\./);
});

test("GHSA-hrr3-gc8f-f4qj: encoded uppercase unreserved host is lowercase", () => {
  const encoded = "//%41.com";
  assert.equal(uri.parse(encoded).error, undefined);
  assert.equal(uri.parse(encoded).host, "a.com");
  assert.equal(uri.normalize(encoded), "//a.com");
  assert.equal(uri.equal(encoded, "//a.com"), true);
});

test("benign numeric, digit-string and empty ports preserve the intended host", () => {
  for (const port of [8124, "8124", ""]) {
    const serialized = uri.serialize({ scheme: "http", host: "trusted.example", port, path: "/app" });
    assert.equal(serialized, port === "" ? "http://trusted.example/app" : "http://trusted.example:8124/app");
    assert.equal(uri.parse(serialized).host, "trusted.example");
    assert.equal(uri.parse(serialized).error, undefined);
  }
});

test("benign HTTPS and IPv6 URIs retain valid authority and resource components", () => {
  const https = uri.parse("https://example.com:8443/app?mode=read#part");
  assert.equal(https.error, undefined);
  assert.equal(https.host, "example.com");
  assert.equal(https.port, 8443);
  assert.equal(uri.serialize(https), "https://example.com:8443/app?mode=read#part");
  const ipv6 = uri.parse("http://[::1]:8124/app");
  assert.equal(ipv6.error, undefined);
  assert.equal(ipv6.host, "::1");
  assert.equal(uri.serialize(ipv6), "http://[::1]:8124/app");
});

test("benign scheme-relative case normalization and relative resolution remain valid", () => {
  assert.equal(uri.parse("//A.com").error, undefined);
  assert.equal(uri.normalize("//A.com"), "//a.com");
  assert.equal(uri.equal("//A.com", "//a.com"), true);
  assert.equal(uri.resolve("https://example.com/a/b", "../c?x=1"), "https://example.com/c?x=1");
});
