"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { InlineFieldSpec } from "@/lib/inline-proposal";
import { formatCurrency } from "@/lib/proposal";

export function InlineField({ spec, currency, errorMessage, active, disabled, onStart, onClose, onSave }: {
  spec: InlineFieldSpec;
  currency: string;
  errorMessage: string;
  active: boolean;
  disabled: boolean;
  onStart: () => void;
  onClose: () => void;
  onSave: (value: string) => Promise<boolean>;
}) {
  const errorId = useId();
  const editorRef = useRef<HTMLSpanElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const display = spec.value && spec.money
    ? formatCurrency(Number(spec.value), currency)
    : spec.value;

  // Leave the browser in charge of the editable DOM while typing. Updating
  // React text children on every keystroke would move the caret.
  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const text = active ? spec.value : display;
    const selection = window.getSelection();
    const preserveCaret = editor.textContent === text && selection?.rangeCount &&
      editor.contains(selection.getRangeAt(0).commonAncestorContainer);
    const previousRange = preserveCaret ? selection.getRangeAt(0).cloneRange() : null;
    if (editor.textContent !== text) editor.textContent = text;
    if (active) {
      editor.focus();
      const range = previousRange ?? document.createRange();
      if (!previousRange) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [active, spec.value, display]);

  useLayoutEffect(() => {
    if (!active) return;
    function placeToolbar() {
      const rect = editorRef.current?.getBoundingClientRect();
      const toolbar = toolbarRef.current?.getBoundingClientRect();
      if (!rect || !toolbar) return;
      const margin = 12;
      const top = rect.bottom + 10 + toolbar.height <= window.innerHeight - margin
        ? rect.bottom + 10
        : Math.max(margin, rect.top - toolbar.height - 10);
      setPosition({
        top,
        left: Math.max(margin, Math.min(rect.left, window.innerWidth - toolbar.width - margin)),
      });
    }
    placeToolbar();
    window.addEventListener("resize", placeToolbar);
    window.addEventListener("scroll", placeToolbar, true);
    const observer = new ResizeObserver(placeToolbar);
    if (editorRef.current) observer.observe(editorRef.current);
    if (toolbarRef.current) observer.observe(toolbarRef.current);
    return () => {
      window.removeEventListener("resize", placeToolbar);
      window.removeEventListener("scroll", placeToolbar, true);
      observer.disconnect();
    };
  }, [active]);


  function close() {
    onClose();
    requestAnimationFrame(() => editorRef.current?.focus());
  }

  async function submit() {
    if (disabled) return;
    const value = editorRef.current?.innerText ?? "";
    if (await onSave(value)) close();
  }

  return <>
    <span
      ref={editorRef}
      className="inline-field-text"
      data-active={active}
      data-empty={!spec.value}
      data-placeholder={`Add ${spec.label.toLowerCase()}…`}
      contentEditable={active && !disabled ? "plaintext-only" : false}
      suppressContentEditableWarning
      role={active ? "textbox" : "button"}
      tabIndex={disabled && !active ? -1 : 0}
      aria-label={`${active ? "" : "Edit "}${spec.label}`}
      aria-multiline={active ? spec.multiline : undefined}
      aria-readonly={active ? disabled : undefined}
      aria-disabled={!active ? disabled : undefined}
      aria-invalid={active ? Boolean(errorMessage) : undefined}
      aria-describedby={active ? errorMessage ? errorId : "inline-save-status" : undefined}
      inputMode={spec.money ? "decimal" : undefined}
      onClick={() => { if (!active && !disabled) onStart(); }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (!active) {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onStart();
          }
          return;
        }
        if (disabled) {
          if (event.key !== "Tab") event.preventDefault();
          return;
        }
        if (event.key === "Escape") { event.preventDefault(); close(); }
        if (event.key === "Enter" && (!spec.multiline || event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          void submit();
        }
      }}
      onPaste={(event) => {
        event.preventDefault();
        if (!active || disabled) return;
        const text = event.clipboardData.getData("text/plain").replace(/\r\n?/g, "\n");
        const selection = window.getSelection();
        if (!selection?.rangeCount || !editorRef.current) return;
        const range = selection.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) return;
        range.deleteContents();
        const node = document.createTextNode(spec.multiline ? text : text.replace(/\n/g, " "));
        range.insertNode(node);
        range.setStartAfter(node);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }}
      onDrop={(event) => event.preventDefault()}
    >{display}</span>
    {active && createPortal(
      <div ref={toolbarRef} className="inline-field-toolbar" role="group" aria-label={`Editing ${spec.label}`} style={position}
        onKeyDown={(event) => { if (event.key === "Escape" && !disabled) close(); }}>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="button button-dark px-4 py-2 disabled:opacity-50" disabled={disabled} onClick={() => void submit()}>{disabled ? "Saving…" : "Save"}</button>
          <button type="button" className="text-link disabled:opacity-50" disabled={disabled} onClick={close}>Cancel</button>
          <span className="text-xs text-ink/65">{spec.label}{spec.money ? ` · ${currency}` : ""}</span>
        </div>
        {errorMessage && <p id={errorId} className="mt-3 text-sm leading-6 text-red-700">{errorMessage}</p>}
      </div>, document.body,
    )}
  </>;
}
