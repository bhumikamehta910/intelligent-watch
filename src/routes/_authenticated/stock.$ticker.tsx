import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { allItemsQuery, tickerEventsQuery } from "@/lib/api";
import { EventCard, ChangeValue } from "@/components/event-card";
import { impactLabel, relativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/stock/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} — PulseIQ` },
      {
        name: "description",
        content: `What changed for ${params.ticker}, why it changed, and how much it matters.`,
      },
      { property: "og:title", content: `${params.ticker} — PulseIQ` },
      {
        property: "og:description",
        content: `Signal timeline and impact analysis for ${params.ticker}.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StockDetail,
});

function StockDetail() {
  const { ticker } = Route.useParams();
  const events = useQuery(tickerEventsQuery(ticker));
  const items = useQuery(allItemsQuery());

  const data = events.data ?? [];
  const company =
    data[0]?.company_name ??
    (items.data ?? []).find((i) => i.ticker === ticker)?.company_name ??
    ticker;

  const avgImpact = data.length
    ? Math.round(data.reduce((sum, e) => sum + e.impact, 0) / data.length)
    : 0;
  const netMove = data.reduce((sum, e) => sum + Number(e.price_change_pct ?? 0), 0);
  const positives = data.filter((e) => e.sentiment === "positive").length;
  const onLists = (items.data ?? []).filter((i) => i.ticker === ticker);

  return (
    <>
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-end gap-3">
        <h1 className="num text-3xl font-semibold tracking-tight">{ticker}</h1>
        <span className="pb-1 text-[15px] text-muted-foreground">{company}</span>
      </div>
      {onLists.length ? (
        <p className="mt-2 text-[13px] text-muted-foreground">
          On {onLists.map((i) => i.watchlists?.name).filter(Boolean).join(", ")}
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-muted-foreground">Not on any of your watchlists yet.</p>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Signals tracked" value={String(data.length)} />
        <Stat
          label="Cumulative move"
          value={<ChangeValue value={data.length ? netMove : null} className="text-[15px]" />}
        />
        <Stat label="Average impact" value={`${avgImpact} · ${impactLabel(avgImpact)}`} />
        <Stat
          label="Signal balance"
          value={`${positives} positive / ${data.length - positives} other`}
        />
      </div>

      <h2 className="mb-3 mt-10 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        Why it moved
      </h2>

      {events.isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : data.length === 0 ? (
        <div className="panel p-8 text-center text-[13.5px] text-muted-foreground">
          PulseIQ has no signals for {ticker} yet. We'll surface them here as soon as something
          changes.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      )}

      {data.length ? (
        <p className="mt-6 text-[12.5px] text-muted-foreground">
          Most recent signal {relativeTime(data[0]!.occurred_at)}.
        </p>
      ) : null}
    </>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <p className="text-[12px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium">{value}</p>
    </div>
  );
}
