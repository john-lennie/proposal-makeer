import { describe, expect, test } from "vitest";

import { isEmailVerificationRequired } from "@/lib/auth-errors";

describe("email verification recovery", () => {
  test("recognizes the auth error code independently of message wording", () => {
    expect(isEmailVerificationRequired({
      code: "EMAIL_NOT_VERIFIED",
      message: "Please verify your address",
    })).toBe(true);
  });

  test.each(["Email not verified", "email not verified.", " Email is not verified! "])(
    "offers recovery for a message-only response: %s",
    (message) => {
      expect(isEmailVerificationRequired({ message, status: 403 })).toBe(true);
    },
  );

  test.each([
    null,
    undefined,
    "Email not verified",
    { message: null },
    { code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" },
    { status: 403, message: "Forbidden" },
    { message: "Service failed: email not verified by upstream" },
  ])("does not misclassify unrelated or malformed responses: %j", (error) => {
    expect(isEmailVerificationRequired(error)).toBe(false);
  });
});
