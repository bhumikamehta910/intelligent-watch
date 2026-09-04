import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import type { MarketEvent } from "@/lib/api";
import { impactLabel, relativeTime, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SentimentDot({ sentiment }: { sentiment: string }) {
  return (
    <span
      className={cn(
        "size-1.5 rounded-full",
        sentiment === "positive" && "bg-positive",
        sentiment === "negative" && "bg-negative",
        sentiment === "neutral" && "bg-neutralized",
      )}
    />
  );
}

export function ChangeValue({ value, className }: { value: number | null; className?: string }) {
  const positive = (value ?? 0) >= 0;
  return (
    <span
      className={cn(
        "num text-[13px]",
        value === null ? "text-muted-foreground" : positive ? "text-positive" : "text-negative",
        className,
      )}
    >
      {signedPct(value)}
    </span>
  );
}

export function EventCard({ event, isNew }: { event: MarketEvent; isNew?: boolean }) {
  return (
    <article className="panel group relative p-4 transition-colors hover:border-border/100 hover:bg-surface-raised">
      <div className="flex items-center gap-2.5">
        <Link
          to="/stock/$ticker"
          params={{ ticker: event.ticker }}
          className="num rounded-md bg-accent px-1.5 py-0.5 text-[12px] font-medium text-foreground transition-colors hover:bg-primary/20 hover:text-primary"
        >
          {event.ticker}
        </Link>
        <SentimentDot sentiment={event.sentiment} />
        <span className="text-[12px] uppercase tracking-wide text-muted-foreground">
          {event.category}
        </span>
        {isNew ? (
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            New
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-3">
          <ChangeValue value={event.price_change_pct as number | null} />
          <span className="text-[12px] text-muted-foreground">{relativeTime(event.occurred_at)}</span>
        </span>
      </div>

      <h3 className="mt-3 text-[15px] font-medium leading-snug">{event.headline}</h3>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{event.summary}</p>

      <div className="mt-3 flex items-center gap-3 border-t border-border/60 pt-3">
        <ImpactMeter impact={event.impact} />
        <span className="text-[12px] text-muted-foreground">
          {impactLabel(event.impact)} impact · {event.source ?? "PulseIQ"}
        </span>
        <Link
          to="/stock/$ticker"
          params={{ ticker: event.ticker }}
          className="ml-auto flex items-center gap-1 text-[12px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        >
          Detail <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </article>
  );
}

export function ImpactMeter({ impact }: { impact: number }) {
  return (
    <span className="flex items-center gap-[3px]" aria-label={`Impact ${impact}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={cn(
            "h-2.5 w-1 rounded-[1px]",
            impact / 20 > i ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}
