"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
} from "react";

import { Mark } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { isEmailVerificationRequired } from "@/lib/auth-errors";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";
type SignUpField = "name" | "email" | "password";

const completeEmailPattern =
  /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;

function validateSignUpField(field: SignUpField, value: string): string {
  if (field === "name") {
    return value.trim().length >= 2 ? "" : "Enter your full name.";
  }

  if (field === "email") {
    return completeEmailPattern.test(value.trim())
      ? ""
      : "Enter a complete email address, including the domain ending.";
  }

  return value.length >= 8 ? "" : "Use at least 8 characters.";
}

const copy: Record<
  AuthMode,
  { eyebrow: string; title: string; submit: string }
> = {
  "sign-in": {
    eyebrow: "Welcome back",
    title: "Sign in to your workspace.",
    submit: "Sign in",
  },
  "sign-up": {
    eyebrow: "Create your account",
    title: "Start making better proposals.",
    submit: "Create account",
  },
  "forgot-password": {
    eyebrow: "Password recovery",
    title: "Request a secure reset link.",
    submit: "Send reset link",
  },
  "reset-password": {
    eyebrow: "Choose a new password",
    title: "Reset your account password.",
    submit: "Reset password",
  },
};

export function AuthForm({
  mode,
  callbackURL = "/dashboard",
  token,
  requiresEmailVerification = false,
}: {
  mode: AuthMode;
  callbackURL?: string;
  token?: string;
  requiresEmailVerification?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<SignUpField, string>>
  >({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<SignUpField, boolean>>
  >({});

  function validateLive(event: ChangeEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SignUpField;
    const value = event.currentTarget.value;

    if (field === "email") setVerificationEmail("");

    if (mode !== "sign-up" || !touchedFields[field]) return;

    setFieldErrors((errors) => ({
      ...errors,
      [field]: validateSignUpField(field, value),
    }));
  }

  async function resendVerification() {
    if (!verificationEmail || pending || resending) return;

    setResending(true);
    setIsError(false);
    setMessage("");
    try {
      const result = await authClient.sendVerificationEmail({
        email: verificationEmail,
        callbackURL,
      });
      if (result.error) throw new Error(result.error.message);
      setMessage(
        `Verification email requested for ${verificationEmail}. Check your inbox and spam folder, then follow the link to finish signing in.`,
      );
    } catch {
      setIsError(true);
      setMessage(
        "We couldn't send the verification email. Please wait a minute and try again.",
      );
    } finally {
      setResending(false);
    }
  }

  function validateOnBlur(event: FocusEvent<HTMLInputElement>) {
    const field = event.currentTarget.name as SignUpField;
    const value = event.currentTarget.value;

    if (mode !== "sign-up") return;

    setTouchedFields((fields) => ({ ...fields, [field]: true }));
    setFieldErrors((errors) => ({
      ...errors,
      [field]: validateSignUpField(field, value),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (mode === "sign-up") {
      const errors = {
        name: validateSignUpField("name", name),
        email: validateSignUpField("email", email),
        password: validateSignUpField("password", password),
      };

      setTouchedFields({ name: true, email: true, password: true });
      setFieldErrors(errors);

      if (Object.values(errors).some(Boolean)) return;
    }

    setPending(true);
    setMessage("");
    setIsError(false);
    setVerificationEmail("");

    try {
      if (mode === "sign-in") {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL,
        });
        if (isEmailVerificationRequired(result.error)) {
          setVerificationEmail(email);
          setMessage(
            "Verify your email to finish signing in. If your original link has expired or is missing, request a new verification email below.",
          );
          return;
        }
        if (result.error) throw new Error(result.error.message);
        router.push(callbackURL);
        router.refresh();
        return;
      }

      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL,
        });
        if (result.error) throw new Error(result.error.message);

        if (result.data?.token) {
          router.push(callbackURL);
          router.refresh();
          return;
        }

        setMessage(
          requiresEmailVerification
            ? "Account created. Check your email to verify your address before signing in."
            : "Account created. You can now sign in.",
        );
        if (requiresEmailVerification) setVerificationEmail(email);
        form.reset();
        setTouchedFields({});
        setFieldErrors({});
        return;
      }

      if (mode === "forgot-password") {
        const result = await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });
        if (result.error) throw new Error(result.error.message);
        setMessage(
          "If an account exists for that email, a password reset link has been sent.",
        );
        return;
      }

      if (!token) {
        throw new Error("This password reset link is invalid or incomplete.");
      }

      const confirmation = String(
        formData.get("passwordConfirmation") ?? "",
      );
      if (password !== confirmation) {
        throw new Error("The passwords do not match.");
      }

      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) throw new Error(result.error.message);
      setMessage(
        "Password reset. Sign in with your new password. If your email still needs verification, you can request a new verification email on the sign-in screen.",
      );
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Authentication could not be completed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f2f1ed] px-5 py-12 text-ink">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em]"
        >
          <Mark className="size-6" />
          Sonder
        </Link>
        <section className="rounded-xl border border-ink/10 bg-[#fbfaf7] p-6 sm:p-8">
          <p className="eyebrow text-olive">{copy[mode].eyebrow}</p>
          <h1 className="mt-4 font-display text-4xl leading-none tracking-[-0.04em]">
            {copy[mode].title}
          </h1>

          <form
            onSubmit={submit}
            className="mt-8 grid gap-5"
            noValidate={mode === "sign-up"}
          >
            {mode === "sign-up" && (
              <label>
                <span className="field-label">Name</span>
                <input
                  name="name"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={160}
                  onChange={validateLive}
                  onBlur={validateOnBlur}
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "name-error" : undefined}
                />
                {fieldErrors.name && (
                  <span
                    id="name-error"
                    className="mt-2 block text-sm text-red-700"
                  >
                    {fieldErrors.name}
                  </span>
                )}
              </label>
            )}

            {mode !== "reset-password" && (
              <label>
                <span className="field-label">Email</span>
                <input
                  name="email"
                  placeholder="you@yourstudio.com"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  onChange={validateLive}
                  onBlur={validateOnBlur}
                  aria-invalid={
                    mode === "sign-up" && Boolean(fieldErrors.email)
                  }
                  aria-describedby={
                    mode === "sign-up" && fieldErrors.email
                      ? "email-error"
                      : undefined
                  }
                />
                {mode === "sign-up" && fieldErrors.email && (
                  <span
                    id="email-error"
                    className="mt-2 block text-sm text-red-700"
                  >
                    {fieldErrors.email}
                  </span>
                )}
              </label>
            )}

            {(mode === "sign-in" ||
              mode === "sign-up" ||
              mode === "reset-password") && (
              <label>
                <span className="field-label">
                  {mode === "reset-password" ? "New password" : "Password"}
                </span>
                <input
                  name="password"
                  placeholder={
                    mode === "sign-in"
                      ? "Enter your password"
                      : "At least 8 characters"
                  }
                  type="password"
                  autoComplete={
                    mode === "sign-in" ? "current-password" : "new-password"
                  }
                  required
                  minLength={8}
                  maxLength={128}
                  onChange={validateLive}
                  onBlur={validateOnBlur}
                  aria-invalid={
                    mode === "sign-up" && Boolean(fieldErrors.password)
                  }
                  aria-describedby={
                    mode === "sign-up" && fieldErrors.password
                      ? "password-error"
                      : undefined
                  }
                />
                {mode === "sign-up" && fieldErrors.password && (
                  <span
                    id="password-error"
                    className="mt-2 block text-sm text-red-700"
                  >
                    {fieldErrors.password}
                  </span>
                )}
              </label>
            )}

            {mode === "reset-password" && (
              <label>
                <span className="field-label">Confirm new password</span>
                <input
                  name="passwordConfirmation"
                  placeholder="Re-enter your new password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                />
              </label>
            )}

            {message && (
              <p
                className={`text-sm ${isError ? "text-red-700" : "text-olive"}`}
                role={isError ? "alert" : "status"}
                aria-live="polite"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || resending}
              className="button button-dark mt-1 h-11 justify-center disabled:opacity-60"
            >
              {pending ? "Please wait…" : copy[mode].submit}
            </button>
          </form>

          {verificationEmail && (
            <button
              type="button"
              onClick={resendVerification}
              disabled={pending || resending}
              className="text-link mt-5 text-sm disabled:opacity-60"
            >
              {resending ? "Sending verification email…" : "Resend verification email"}
            </button>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-3 text-sm">
            {mode === "sign-in" && (
              <>
                <Link href="/forgot-password" className="text-link">
                  Forgot password?
                </Link>
                <Link href="/sign-up" className="text-link">
                  Create account
                </Link>
              </>
            )}
            {mode === "sign-up" && (
              <Link href="/sign-in" className="text-link">
                Already have an account? Sign in
              </Link>
            )}
            {(mode === "forgot-password" ||
              mode === "reset-password") && (
              <Link href="/sign-in" className="text-link">
                Back to sign in
              </Link>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
