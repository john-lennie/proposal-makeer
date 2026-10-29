/** Support auth responses that omit the machine-readable error code. */
export function isEmailVerificationRequired(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  if ("code" in error && error.code === "EMAIL_NOT_VERIFIED") return true;

  return (
    "message" in error &&
    typeof error.message === "string" &&
    /^email (?:is )?not verified[.!]?$/i.test(error.message.trim())
  );
}
