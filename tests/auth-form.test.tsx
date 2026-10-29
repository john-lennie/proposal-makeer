import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: {} }));

import { AuthForm } from "@/components/auth-form";

describe("authentication form progressive fallback", () => {
  test.each(["sign-in", "sign-up", "forgot-password", "reset-password"] as const)(
    "%s never puts credentials in a GET URL if JavaScript has not loaded",
    (mode) => {
      const html = renderToStaticMarkup(<AuthForm mode={mode} />);
      expect(html).toMatch(/<form[^>]*method="post"/);
    },
  );
});
