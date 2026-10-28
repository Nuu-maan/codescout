import assert from "node:assert/strict";
import test from "node:test";
import { rateLimit } from "./http.ts";

test("limits each client per bucket within the window", () => {
  const request = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
  assert.equal(rateLimit(request, "test", 2, 1_000, 0), null);
  assert.equal(rateLimit(request, "test", 2, 1_000, 10), null);
  assert.equal(rateLimit(request, "test", 2, 1_000, 20)?.status, 429);
  assert.equal(rateLimit(request, "other", 2, 1_000, 20), null);
  assert.equal(rateLimit(request, "test", 2, 1_000, 1_001), null);
});
