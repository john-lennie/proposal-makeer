import { AuthForm } from "@/components/auth-form";
import { isEmailDeliveryConfigured } from "@/lib/auth";

export const metadata = {
  title: "Create account — Sonder",
};

export default function SignUpPage() {
  return (
    <AuthForm
      mode="sign-up"
      requiresEmailVerification={isEmailDeliveryConfigured}
    />
  );
}
