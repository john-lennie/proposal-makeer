import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Reset password — Sonder",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <AuthForm mode="reset-password" token={token} />;
}
