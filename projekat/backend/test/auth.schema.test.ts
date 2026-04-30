import assert from "node:assert/strict";
import { test } from "vitest";

import { loginSchema, registerSchema, resetPasswordSchema } from "../src/modules/auth/auth.schema";

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

test("registerSchema rejects numbers in first and last name", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        firstName: "Ana123",
        lastName: "Hadzic9",
        username: "ahadzic",
        email: "ana@example.com",
        password: "Password1",
      }),
    /can only contain letters, spaces, apostrophes, and hyphens/i,
  );
});

test("registerSchema accepts names with diacritics and hyphen", () => {
  const result = registerSchema.parse({
    firstName: "Željka",
    lastName: "Hadžić-Kovač",
    username: "zhadzic",
    email: "zeljka@example.com",
    password: "Password1",
  });

  assert.equal(result.firstName, "Željka");
  assert.equal(result.lastName, "Hadžić-Kovač");
});

test("loginSchema requires both username and password", () => {
  assert.throws(
    () => loginSchema.parse({ username: "", password: "" }),
    /required/i,
  );
});

test("registerSchema rejects unknown fields like companyId", () => {
  assert.throws(
    () =>
      registerSchema.parse({
        firstName: "Ana",
        lastName: "Hadzic",
        username: "ahadzic",
        email: "ana@example.com",
        companyId: 1,
        password: "Password1",
      }),
    /unrecognized key/i,
  );
});

test("resetPasswordSchema rejects invalid emails", () => {
  assert.throws(
    () => resetPasswordSchema.parse({ email: "not-an-email" }),
    /invalid email format/i,
  );
});
