import { cn } from "@/lib/utils";
import type { AttentionResult } from "@/lib/engines/attention-engine";

/**
 * Shows exactly how an attention score was assembled:
 * price / volume / peer / volatility points out of their maximums.
 */
export function ScoreBreakdown({
  result,
  className,
}: {
  result: AttentionResult;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {result.components.map((c) => (
        <div key={c.key}>
          <div className="flex items-baseline gap-2">
            <span className="text-[12.5px] text-muted-foreground">{c.label}</span>
            <span className="num ml-auto text-[12.5px]">
              {c.points}
              <span className="text-muted-foreground">/{c.max}</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-accent">
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(c.points / c.max) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{c.detail}</p>
        </div>
      ))}
      <div className="flex items-baseline gap-2 border-t border-border/60 pt-2.5">
        <span className="text-[12.5px] font-medium">Total attention score</span>
        <span className="num ml-auto text-[13px] font-medium">
          {result.breakdown.totalScore}
          <span className="text-muted-foreground">/100</span>
        </span>
      </div>
      <p className="text-[12px] text-muted-foreground">
        Classification: <span className="text-foreground">{result.classification}</span> (0-39
        Stable · 40-69 Watch · 70-100 Critical)
      </p>
    </div>
  );
}
