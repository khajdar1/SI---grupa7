import assert from "node:assert/strict";
import test from "node:test";

import { loginSchema, registerSchema, resetPasswordSchema } from "./auth.schema";

test("registerSchema accepts valid input and normalizes email", () => {
  const result = registerSchema.parse({
    firstName: "Ana",
    lastName: "Hadzic",
    username: "ahadzic",
    email: "ANA@Example.com ",
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

test("resetPasswordSchema rejects invalid emails", () => {
  assert.throws(
    () => resetPasswordSchema.parse({ email: "not-an-email" }),
    /invalid email format/i,
  );
});
