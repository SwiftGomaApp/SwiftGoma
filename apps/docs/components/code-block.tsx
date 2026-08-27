"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

function highlightJson(json: string) {
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-[#7dd3fc]"; // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "text-[#f0abfc]" : "text-[#86efac]"; // key vs string value
      } else if (/true|false/.test(match)) {
        cls = "text-[#fda4af]";
      } else if (/null/.test(match)) {
        cls = "text-[#a1a1aa]";
      }
      return `<span class="${cls}">${match}</span>`;
    },
  );
}

export function CodeBlock({
  code,
  language = "json",
  title,
}: {
  code: string;
  language?: string;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  const html = language === "json" ? highlightJson(code) : null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-code-bg text-code-foreground">
      {title && (
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-white/50">
          <span>{title}</span>
        </div>
      )}
      <div className="relative">
        <button
          onClick={handleCopy}
          className={cn(
            "absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70 transition hover:bg-white/10",
          )}
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
        <pre className="scrollbar-thin overflow-x-auto p-4 text-[13px] leading-relaxed">
          {html ? (
            <code dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <code>{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}
