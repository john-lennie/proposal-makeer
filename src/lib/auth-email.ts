import "server-only";

interface AuthEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendAuthEmail(email: AuthEmail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error(
      "Authentication email delivery is not configured. Set RESEND_API_KEY and AUTH_EMAIL_FROM.",
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Authentication email delivery failed (${response.status}).`);
  }
}
