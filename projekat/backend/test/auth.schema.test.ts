import assert from "node:assert/strict";
import { test } from "vitest";

import { loginSchema, registerSchema, resetPasswordSchema } from "../src/modules/auth/auth.schema";

test("registerSchema accepts valid input and normalizes email", () => {
  const result = registerSchema.parse({
    firstName: "Ana",
    lastName: "Hadzic",
    username: "ahadzic",
    email: "ANA@Example.com ",
    companyId: 1,
    password: "Password1",
  });

  assert.equal(result.email, "ana@example.com");
});

test("registerSchema rejects HTML content in text fields", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        firstName: "<script>alert(1)</script>",
        lastName: "Hadzic",
        username: "ahadzic",
        email: "ana@example.com",
        companyId: 1,
        password: "Password1",
      }),
    /must not contain HTML or script content/i,
  );
});

test("loginSchema requires both username and password", () => {
  assert.throws(
    () => loginSchema.parse({ username: "", password: "" }),
    /required/i,
  );
});

test("registerSchema requires a valid company identifier", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        firstName: "Ana",
        lastName: "Hadzic",
        username: "ahadzic",
        email: "ana@example.com",
        companyId: 0,
        password: "Password1",
      }),
    /company is required/i,
  );
});

test("resetPasswordSchema rejects invalid emails", () => {
  assert.throws(
    () => resetPasswordSchema.parse({ email: "not-an-email" }),
    /invalid email format/i,
  );
});
