import { describe, expect, test } from "vitest";

import { updateProfileSchema } from "../src/modules/profile/profile.schema";

describe("profile schema language preference", () => {
  const validProfile = {
    firstName: "Ana",
    lastName: "Admin",
    email: "ana.admin@example.com",
    language: "bs",
  };

  test("accepts supported profile languages", () => {
    expect(updateProfileSchema.parse(validProfile).language).toBe("bs");
  });

  test("rejects unsupported profile languages", () => {
    const result = updateProfileSchema.safeParse({
      ...validProfile,
      language: "de",
    });

    expect(result.success).toBe(false);
  });
});
