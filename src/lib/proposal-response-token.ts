import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_CONTEXT = "sonder:proposal-response:v1";

function responseSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must contain at least 32 characters to secure proposal responses.",
    );
  }

  return secret;
}

export function createProposalResponseToken(revisionId: string): string {
  return createHmac("sha256", responseSecret())
    .update(`${TOKEN_CONTEXT}:${revisionId}`)
    .digest("base64url");
}

export function verifyProposalResponseToken(
  revisionId: string,
  candidate: string,
): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(candidate)) return false;

  const expected = Buffer.from(createProposalResponseToken(revisionId));
  const supplied = Buffer.from(candidate);

  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function proposalResponseUrl(slug: string, revisionId: string): string {
  const token = createProposalResponseToken(revisionId);
  return `/p/${slug}?response=${encodeURIComponent(token)}`;
}

export function hashProposalResponseMetadata(value: string): string {
  return createHmac("sha256", responseSecret())
    .update(`sonder:proposal-response-metadata:v1:${value}`)
    .digest("base64url");
}
