import { AuthForm } from "@/components/auth-form";

export const metadata = {
  title: "Forgot password — Sonder",
};

export default function ForgotPasswordPage() {
  return <AuthForm mode="forgot-password" />;
}
