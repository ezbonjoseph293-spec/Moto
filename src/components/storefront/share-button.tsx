"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-ink"
    >
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Link copied
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden="true" />
          Share this listing
        </>
      )}
    </button>
  );
}
