import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Sign in — Sonder",
};

function safeCallback(value: string | undefined): string {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const { callbackURL } = await searchParams;
  return <AuthForm mode="sign-in" callbackURL={safeCallback(callbackURL)} />;
}
