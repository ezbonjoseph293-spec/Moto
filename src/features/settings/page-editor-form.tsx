"use client";

import { useActionState, useState } from "react";
import type { Page } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownContent } from "@/components/content/markdown-content";
import { updatePageContentAction, type FormState } from "./actions";

const initialState: FormState = { ok: false };

export function PageEditorForm({ page }: { page: Page }) {
  const [state, formAction, isPending] = useActionState(updatePageContentAction, initialState);
  const [content, setContent] = useState(page.content);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="pageId" value={page.id} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={page.title} required maxLength={160} />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Content (Markdown)</Label>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="text-xs font-medium text-primary hover:underline"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-64 rounded-md border border-border bg-surface p-4">
            <MarkdownContent content={content} />
          </div>
        ) : (
          <Textarea
            id="content"
            name="content"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            placeholder={"## Heading\n\nWrite your policy here. **Bold**, _italic_, lists, and links are supported."}
          />
        )}
        <p className="text-xs text-muted-foreground">
          Supports Markdown: headings (##), **bold**, _italic_, lists (- item), and [links](url).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="seoTitle">SEO title</Label>
          <Input id="seoTitle" name="seoTitle" defaultValue={page.seoTitle ?? ""} maxLength={160} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="seoDescription">SEO description</Label>
          <Input
            id="seoDescription"
            name="seoDescription"
            defaultValue={page.seoDescription ?? ""}
            maxLength={300}
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="text-sm text-available">{state.message}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save page"}
      </Button>
    </form>
  );
}
