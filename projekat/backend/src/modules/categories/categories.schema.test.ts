import assert from "node:assert/strict";
import test from "node:test";

import {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
} from "./categories.schema";

test("createCategorySchema trims text input", () => {
  const result = createCategorySchema.parse({
    name: " HVAC ",
    description: " Cooling systems ",
  });

  assert.equal(result.name, "HVAC");
  assert.equal(result.description, "Cooling systems");
});

test("createCategorySchema rejects HTML input", () => {
  assert.throws(
    () =>
      createCategorySchema.parse({
        name: "HVAC",
        description: "<img src=x onerror=alert(1)>",
      }),
    /must not contain HTML or script content/i,
  );
});

test("updateCategorySchema requires at least one field", () => {
  assert.throws(() => updateCategorySchema.parse({}), /at least one field/i);
});

test("updateCategoryStatusSchema requires boolean active flag", () => {
  assert.throws(
    () => updateCategoryStatusSchema.parse({ active: "true" }),
    /must be true or false/i,
  );
});
