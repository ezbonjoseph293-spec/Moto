import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("mb-8 max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-2 text-xs font-semibold tracking-widest text-brand uppercase">{eyebrow}</p>
      )}
      <h2 className="font-heading text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-muted-foreground">{description}</p>}
    </div>
  );
}
