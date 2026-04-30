import { expect, test } from "vitest";

import { loginSchema } from "../src/modules/auth/auth.schema";

test("Auth module - login schema accepts valid credentials", () => {
  const payload = loginSchema.parse({
    username: "korisnik",
    password: "Password1",
  });

  expect(payload.username).toBe("korisnik");
  expect(payload.password).toBe("Password1");
});
