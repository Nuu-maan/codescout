import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultResponseModel,
  getResponseModel,
  isResponseModelId,
  responseModels,
} from "./models.ts";

test("accepts only configured response models", () => {
  for (const model of responseModels) assert.equal(isResponseModelId(model.id), true);
  assert.equal(isResponseModelId("openrouter/arbitrary-model"), false);
  assert.equal(isResponseModelId(undefined), false);
});

test("resolves model metadata", () => {
  assert.equal(getResponseModel(defaultResponseModel).name, "Dots 3 Note");
});
