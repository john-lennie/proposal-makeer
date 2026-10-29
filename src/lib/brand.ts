import type { CSSProperties } from "react";
import type { ThemeSettings } from "@/db/types";

export const DEFAULT_BRAND: Required<ThemeSettings> = {
  displayName: "Your studio",
  logoAssetUrl: "",
  accentColor: "#677057",
  headingStyle: "editorial",
};

export function isSafeLogoUrl(value: string): boolean {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function validateBrand(input: unknown):
  | { success: true; data: ThemeSettings }
  | { success: false; message: string } {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Invalid brand settings." };
  }
  const values = input as Record<string, unknown>;
  const { displayName, accentColor, logoAssetUrl, headingStyle } = values;
  if (typeof displayName !== "string" || !displayName.trim() || displayName.trim().length > 160) {
    return { success: false, message: "Enter a studio name of up to 160 characters." };
  }
  if (typeof accentColor !== "string" || !/^#[0-9a-f]{6}$/i.test(accentColor)) {
    return { success: false, message: "Use a six-digit hex color, such as #677057." };
  }
  if (typeof logoAssetUrl !== "string" || logoAssetUrl.length > 2048 || !isSafeLogoUrl(logoAssetUrl.trim())) {
    return { success: false, message: "Use an HTTPS image URL for your logo, or leave it empty." };
  }
  if (headingStyle !== "editorial" && headingStyle !== "modern") {
    return { success: false, message: "Choose one of the available heading styles." };
  }
  return { success: true, data: {
    displayName: displayName.trim(), accentColor: accentColor.toLowerCase(),
    logoAssetUrl: logoAssetUrl.trim(), headingStyle,
  } };
}

/** Workspace changes apply to drafts; published snapshots remain independent. */
export function resolveBrand(workspace: ThemeSettings, proposal: ThemeSettings = {}): ThemeSettings {
  return { ...proposal, ...workspace };
}

export function brandStyle(theme: ThemeSettings): CSSProperties {
  const accent = theme.accentColor && /^#[0-9a-f]{6}$/i.test(theme.accentColor)
    ? theme.accentColor : DEFAULT_BRAND.accentColor;
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(accent.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  return {
    "--brand-accent": accent,
    "--brand-on-accent": luminance > 0.179 ? "#000000" : "#ffffff",
    "--brand-heading": theme.headingStyle === "modern"
      ? '"Helvetica Neue", Helvetica, Arial, sans-serif'
      : 'Georgia, "Times New Roman", serif',
  } as CSSProperties;
}
