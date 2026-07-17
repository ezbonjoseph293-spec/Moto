import ReactMarkdown from "react-markdown";

/**
 * Renders dealer-authored Markdown (policy pages, about page) without
 * `dangerouslySetInnerHTML` — react-markdown never renders raw HTML by
 * default, so this is safe against XSS from dealer-supplied content.
 */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-ink/80 sm:text-base">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className="font-heading text-xl font-bold text-ink">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="font-heading text-lg font-bold text-ink">{children}</h3>
          ),
          h3: ({ children }) => <h4 className="font-heading font-bold text-ink">{children}</h4>,
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          a: ({ href, children }) => (
            <a href={href} className="text-brand underline underline-offset-4">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="text-ink">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
