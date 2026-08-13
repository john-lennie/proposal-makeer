"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { recordPublicProposalResponse } from "@/data/proposal-responses";
import { hashProposalResponseMetadata } from "@/lib/proposal-response-token";

export interface ProposalResponseActionState {
  status: "idle" | "success" | "error";
  message: string;
  decision?: "ACCEPTED" | "DECLINED";
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function respondToProposalAction(
  _state: ProposalResponseActionState,
  formData: FormData,
): Promise<ProposalResponseActionState> {
  const slug = text(formData, "slug");
  const decision = text(formData, "decision");
  const responseToken = text(formData, "responseToken");
  const respondentName = text(formData, "respondentName");
  const respondentEmail = text(formData, "respondentEmail").toLowerCase();
  const confirmed = text(formData, "confirmed");
  const website = text(formData, "website");

  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
    (decision !== "ACCEPTED" && decision !== "DECLINED") ||
    !/^[A-Za-z0-9_-]{43}$/.test(responseToken) ||
    respondentName.length < 2 ||
    respondentName.length > 160 ||
    respondentEmail.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(respondentEmail) ||
    confirmed !== "yes" ||
    website !== ""
  ) {
    return { status: "error", message: "Invalid proposal response." };
  }

  try {
    const requestHeaders = await headers();
    const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = requestHeaders.get("user-agent")?.slice(0, 500);
    const result = await recordPublicProposalResponse({
      slug,
      decision,
      responseToken,
      respondentName,
      respondentEmail,
      ...(forwardedFor
        ? { sourceIpHash: hashProposalResponseMetadata(forwardedFor) }
        : {}),
      ...(userAgent ? { userAgent } : {}),
    });

    if (result.status === "not_found" || result.status === "unavailable") {
      return { status: "error", message: result.message };
    }

    revalidatePath(`/p/${slug}`);
    const accepted = result.decision === "ACCEPTED";
    return {
      status: "success",
      decision: result.decision,
      message:
        result.status === "already_recorded"
          ? `This proposal was already ${accepted ? "accepted" : "declined"}.`
          : `Proposal ${accepted ? "accepted" : "declined"}. Your response has been recorded.`,
    };
  } catch {
    return {
      status: "error",
      message: "Your response could not be recorded. Please try again.",
    };
  }
}
