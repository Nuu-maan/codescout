import assert from "node:assert/strict";
import test from "node:test";
import { isValidOpenRouterKey } from "./openrouter-key.ts";

test("validates personal OpenRouter keys", () => {
  assert.equal(isValidOpenRouterKey("sk-or-v1-abcdefghijklmnopqrstuvwxyz"), true);
  assert.equal(isValidOpenRouterKey("sk-not-openrouter"), false);
  assert.equal(isValidOpenRouterKey("sk-or-v1-too-short"), false);
  assert.equal(isValidOpenRouterKey(`sk-or-v1-${"a".repeat(504)}`), false);
});
