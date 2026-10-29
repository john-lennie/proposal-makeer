"use client";

import { useActionState, useState } from "react";
import { saveBrandAction } from "@/app/settings/brand/actions";
import type { ThemeSettings } from "@/db/types";
import { initialEditorActionState } from "@/lib/action-state";
import { brandStyle, DEFAULT_BRAND, isSafeLogoUrl } from "@/lib/brand";

export function BrandSettingsForm({ brand, canEdit }: { brand: ThemeSettings; canEdit: boolean }) {
  const [values, setValues] = useState({ ...DEFAULT_BRAND, ...brand });
  const [state, action, pending] = useActionState(saveBrandAction, initialEditorActionState);
  const [failedLogo, setFailedLogo] = useState("");
  const set = (key: keyof ThemeSettings, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const showLogo = values.logoAssetUrl && isSafeLogoUrl(values.logoAssetUrl) && failedLogo !== values.logoAssetUrl;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={action} className="editor-panel">
        <fieldset disabled={!canEdit || pending} className="grid min-w-0 gap-6">
          <legend className="mb-6 text-sm font-medium">Your studio identity</legend>
          <label><span className="field-label">Studio name</span>
            <input name="displayName" value={values.displayName} onChange={(e) => set("displayName", e.target.value)} required maxLength={160} placeholder="Alder House Studio" />
          </label>
          <label><span className="field-label">Logo image URL</span>
            <input name="logoAssetUrl" type="url" value={values.logoAssetUrl} onChange={(e) => set("logoAssetUrl", e.target.value)} maxLength={2048} placeholder="https://yourstudio.com/logo.png" aria-describedby="logo-hint" />
            <span id="logo-hint" className="mt-2 block text-xs leading-5 text-ink/60">Use a publicly accessible HTTPS image. Leave empty to use your studio’s initial.</span>
          </label>
          <div><label htmlFor="brand-accent-color" className="field-label">Accent color</label>
            <span className="flex items-center gap-3">
              <input type="color" aria-label="Choose accent color" className="size-12 shrink-0 cursor-pointer rounded-md border border-ink/20 bg-transparent p-1" value={/^#[0-9a-f]{6}$/i.test(values.accentColor) ? values.accentColor : DEFAULT_BRAND.accentColor} onChange={(e) => set("accentColor", e.target.value)} />
              <input id="brand-accent-color" name="accentColor" value={values.accentColor} onChange={(e) => set("accentColor", e.target.value)} pattern="#[0-9a-fA-F]{6}" required placeholder="#677057" maxLength={7} />
            </span>
          </div>
          <label><span className="field-label">Heading typography</span>
            <select name="headingStyle" value={values.headingStyle} onChange={(e) => set("headingStyle", e.target.value)}>
              <option value="editorial">Editorial · Georgia serif</option>
              <option value="modern">Modern · Helvetica sans serif</option>
            </select>
          </label>
          {canEdit && <button className="button button-dark justify-self-start" type="submit">{pending ? "Saving…" : "Save brand"}</button>}
        </fieldset>
        {!canEdit && <p className="mt-5 text-sm text-ink/65">Ask a workspace owner or admin to update your brand.</p>}
        <p role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={`mt-5 text-sm leading-6 ${state.status === "error" ? "text-red-700" : "text-olive"}`}>{state.message}</p>
      </form>
      <div className="lg:sticky lg:top-8">
        <p className="eyebrow mb-4 text-olive">Live brand preview</p>
        <div className="brand-proposal overflow-hidden rounded-xl border border-ink/10 bg-[#f5f1e8]" style={brandStyle(values)}>
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3 text-sm font-semibold">
              {showLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.logoAssetUrl} alt="" className="h-10 max-w-32 object-contain" onError={() => setFailedLogo(values.logoAssetUrl)} />
              ) : <span className="grid size-10 place-items-center rounded-full border border-current">{values.displayName.charAt(0) || "S"}</span>}
              {values.displayName || "Your studio"}
            </div>
            <p className="eyebrow mt-20 text-ink/65">Prepared for your next client</p>
            <h2 className="brand-heading mt-5 text-5xl leading-none tracking-[-0.04em]">Good work.<br />Beautifully presented.</h2>
            <p className="mt-6 text-sm leading-7 text-ink/65">Your identity, carried through every proposal.</p>
          </div>
          <div className="bg-[var(--brand-accent)] p-8 text-[var(--brand-on-accent)] sm:p-10"><p className="brand-heading text-3xl">A considered approach.</p></div>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink/60">Brand changes update all drafts. Published proposals keep the brand used when they were published.</p>
      </div>
    </div>
  );
}
