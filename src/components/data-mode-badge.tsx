import { Radio, Database } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tells the user whether they're looking at live market data or the stored
 * demo dataset.
 */
export function DataModeBadge({
  mode,
  reason,
  className,
}: {
  mode: "live" | "demo";
  reason?: string | null;
  className?: string;
}) {
  const live = mode === "live";
  return (
    <span
      title={reason ?? undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        live
          ? "border-positive/30 bg-positive/10 text-positive"
          : "border-border/70 bg-accent/50 text-muted-foreground",
        className,
      )}
    >
      {live ? (
        <Radio className="size-3 animate-pulse" />
      ) : (
        <Database className="size-3" />
      )}
      {live ? "Live data" : "Demo data"}
    </span>
  );
}
