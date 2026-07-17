/** Maps a dealer's `Setting.borderRadius` choice to the storefront's --radius CSS variable. */
export const RADIUS_PX: Record<string, string> = {
  none: "0px",
  sm: "0.375rem",
  md: "0.75rem",
  lg: "1.25rem",
};

/** Maps a dealer's `Setting.fontChoice` choice to a heading font stack — all system fonts, no extra network font loads. */
export const FONT_HEADING_STACK: Record<string, string> = {
  default: "var(--font-space-grotesk), var(--font-inter), ui-sans-serif, sans-serif",
  classic: "Georgia, 'Times New Roman', serif",
  modern: "-apple-system, 'Segoe UI', Roboto, ui-sans-serif, sans-serif",
};

/** "+256700000000" -> "https://wa.me/256700000000" */
export function whatsappLink(number: string, text?: string): string {
  const digits = number.replace(/[^0-9]/g, "");
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}
