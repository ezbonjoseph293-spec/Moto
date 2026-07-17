import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "border-border bg-card text-ink placeholder:text-muted-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
