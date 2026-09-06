import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUpRight, Gauge, History, Sparkles } from "lucide-react";
import { DEMO_ACTIVITY_DESC, DEMO_WATCHLIST, type DemoActivity } from "@/lib/demo-data";
import type { MeaningfulEvent } from "@/lib/engines/change-engine";
import { intelligenceQuery, findResult, type AttentionResult } from "@/lib/intelligence";
import { relativeTime, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { ScoreRing } from "@/components/score-ring";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { DataModeBadge } from "@/components/data-mode-badge";

export const Route = createFileRoute("/demo/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(intelligenceQuery()),
  errorComponent: () => (
    <div className="panel p-10 text-center text-[13.5px] text-muted-foreground">
      The demo intelligence data could not be loaded. Please refresh.
    </div>
  ),
  notFoundComponent: () => (
    <div className="panel p-10 text-center text-[13.5px]">Demo workspace not found.</div>
  ),
  head: () => ({
    meta: [
      { title: "Demo workspace — PulseIQ" },
      {
        name: "description",
        content:
          "A pre-populated PulseIQ workspace: calculated attention scores, score breakdowns and a timeline replay for an Indian large-cap watchlist. No account needed.",
      },
      { property: "og:title", content: "Demo workspace — PulseIQ" },
      {
        property: "og:description",
        content: "See what changed, why it changed, and what deserves attention — instantly.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoDashboard,
});

function DemoDashboard() {
  const { data } = useSuspenseQuery(intelligenceQuery());
  const results = data.results;

  return (
    <>
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{DEMO_WATCHLIST.name}</h1>
          <DataModeBadge mode={data.mode} reason={data.reason} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Last visit {relativeTime(DEMO_WATCHLIST.lastSeenAt)} · {results.length} companies · scores
          calculated live from stored snapshots
        </p>
      </div>

      <SinceYouWereAway results={results} events={data.events} />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <AttentionScores results={results} />
          <TimelineReplay results={results} />
        </div>
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Snapshots results={results} />
          <div className="panel p-4">
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              Like what you see?
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
              Create an account to build your own watchlists and get this view for the companies you
              actually follow.
            </p>
            <Link
              to="/auth"
              className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Create an account
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ---------------- 1. Since you were away ---------------- */

function SinceYouWereAway({
  results,
  events,
}: {
  results: AttentionResult[];
  events: MeaningfulEvent[];
}) {
  const top = results[0];

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Since you were away
        </h2>
        <span className="num rounded-full bg-accent px-1.5 text-[11px] text-muted-foreground">
          {events.length}
        </span>
        <span className="ml-auto text-[12px] text-muted-foreground">
          Only changes past the noise floor: price &gt;1% · volume &gt;20% · score ±15
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-3 text-[15px] leading-relaxed">
          Nothing on this watchlist crossed the noise floor since your last visit. Everything moved
          within its normal range — no action needed.
        </p>
      ) : (
        <>
          <p className="mt-3 text-[15px] leading-relaxed">
            <strong className="font-medium">{events.length} meaningful change
            {events.length === 1 ? "" : "s"}</strong> — everything else was normal market noise and
            has been filtered out.
            {top ? (
              <>
                {" "}
                <strong className="font-medium text-positive">{top.ticker}</strong> deserves your
                attention first — score {top.score} ({top.classification}).
              </>
            ) : null}
          </p>

          <div className="mt-4 space-y-2">
            {events.slice(0, 5).map((e) => {
              const r = findResult(results, e.ticker);
              return (
                <Link
                  key={e.id}
                  to="/demo/stock/$ticker"
                  params={{ ticker: e.ticker }}
                  className="block rounded-lg border border-border/70 bg-surface-raised/40 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-primary">
                      {e.category}
                    </span>
                    <span className="num text-[12.5px] font-medium">{e.ticker}</span>
                    <span className="text-[12.5px] text-muted-foreground">{e.companyName}</span>
                    <span
                      className={cn(
                        "num ml-auto text-[12.5px]",
                        (r?.signals.priceChangePercent ?? 0) >= 0
                          ? "text-positive"
                          : "text-negative",
                      )}
                    >
                      {signedPct(r?.signals.priceChangePercent ?? null)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[14px] font-medium leading-snug">{e.headline}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                    {e.reason}
                  </p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- 2 + 3. Attention scores, breakdowns & explanations ---------------- */

function AttentionScores({ results }: { results: AttentionResult[] }) {
  const [open, setOpen] = useState<string | null>(results[0]?.ticker ?? null);

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Gauge className="size-4 text-primary" />
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Attention scores
        </h2>
        <span className="text-[12px] text-muted-foreground">
          price 40 · volume 25 · peers 20 · volatility 15
        </span>
      </div>
      <div className="space-y-3">
        {results.map((a) => (
          <article key={a.ticker} className="panel group p-4">
            <div className="flex flex-wrap items-center gap-3">
              <ScoreRing score={a.score} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="num text-[13px] font-medium">{a.ticker}</span>
                  <span className="truncate text-[13px] text-muted-foreground">
                    {a.companyName}
                  </span>
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    {a.classification}
                  </span>
                </div>
                <p className="mt-0.5 text-[14px] leading-snug">{a.verdict}</p>
              </div>
              <div className="ml-auto text-right">
                <div
                  className={cn(
                    "num text-[15px]",
                    a.signals.priceChangePercent >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {signedPct(a.signals.priceChangePercent)}
                </div>
                <div className="num text-[12px] text-muted-foreground">
                  ₹{a.signals.latest.price.toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
              <Sparkles className="size-3.5 text-primary" />
              {a.explanation.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-border/70 bg-accent/50 px-2.5 py-1 text-[12.5px] text-muted-foreground"
                >
                  {r}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setOpen(open === a.ticker ? null : a.ticker)}
                className="ml-auto text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {open === a.ticker ? "Hide breakdown" : "Score breakdown"}
              </button>
              <Link
                to="/demo/stock/$ticker"
                params={{ ticker: a.ticker }}
                className="flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                Detail <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {open === a.ticker ? (
              <ScoreBreakdown result={a} className="mt-3 border-t border-border/60 pt-3" />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 4. Timeline replay ---------------- */

function TimelineReplay({ results }: { results: AttentionResult[] }) {
  const ordered = useMemo(() => [...DEMO_ACTIVITY_DESC].reverse(), []); // oldest → newest
  const [step, setStep] = useState(ordered.length);
  const shown = ordered.slice(0, step).reverse();
  const cursor = ordered[Math.max(0, step - 1)];

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <History className="size-4 text-primary" />
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Timeline replay
        </h2>
        <span className="text-[12.5px] text-muted-foreground">
          Drag to replay how the story built up
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="num text-[12px] text-muted-foreground">
            {step}/{ordered.length} events
          </span>
          <Slider
            className="w-40"
            min={1}
            max={ordered.length}
            step={1}
            value={[step]}
            onValueChange={(v) => setStep(v[0] ?? ordered.length)}
          />
        </div>
      </div>

      <p className="panel mb-3 px-4 py-2.5 text-[13px] text-muted-foreground">
        Playhead: <span className="text-foreground">{relativeTime(cursor?.occurredAt ?? "")}</span> ·{" "}
        {cursor?.headline}
      </p>

      <ol className="relative space-y-3 border-l border-border/70 pl-5">
        {shown.map((e) => (
          <TimelineRow key={e.id} event={e} result={findResult(results, e.ticker)} />
        ))}
      </ol>
    </section>
  );
}

function TimelineRow({ event, result }: { event: DemoActivity; result?: AttentionResult | undefined }) {
  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[23px] top-3 size-2 rounded-full",
          event.sentiment === "positive" && "bg-positive",
          event.sentiment === "negative" && "bg-negative",
          event.sentiment === "neutral" && "bg-neutralized",
        )}
      />
      <article className="panel p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/demo/stock/$ticker"
            params={{ ticker: event.ticker }}
            className="num rounded-md bg-accent px-1.5 py-0.5 text-[12px] font-medium transition-colors hover:bg-primary/20 hover:text-primary"
          >
            {event.ticker}
          </Link>
          <span className="text-[12px] uppercase tracking-wide text-muted-foreground">
            {event.category}
          </span>
          <span className="ml-auto flex items-center gap-3">
            <span
              className={cn(
                "num text-[13px]",
                (result?.signals.priceChangePercent ?? 0) >= 0 ? "text-positive" : "text-negative",
              )}
            >
              {signedPct(result?.signals.priceChangePercent ?? null)}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {relativeTime(event.occurredAt)}
            </span>
          </span>
        </div>
        <h3 className="mt-3 text-[15px] font-medium leading-snug">{event.headline}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{event.summary}</p>
        <p className="mt-3 border-t border-border/60 pt-2 text-[12px] text-muted-foreground">
          {result
            ? `Attention score ${result.score} · ${result.classification} · ${event.source}`
            : event.source}
        </p>
      </article>
    </li>
  );
}

/* ---------------- snapshots ---------------- */

function Snapshots({ results }: { results: AttentionResult[] }) {
  return (
    <div className="panel p-4">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        Latest snapshots
      </h2>
      <ul className="mt-3 space-y-2.5">
        {results.map((r) => (
          <li key={r.ticker}>
            <Link
              to="/demo/stock/$ticker"
              params={{ ticker: r.ticker }}
              className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-accent/60"
            >
              <div className="min-w-0">
                <div className="num text-[12.5px] font-medium">{r.ticker}</div>
                <div className="truncate text-[12px] text-muted-foreground">{r.companyName}</div>
              </div>
              <div className="ml-auto text-right">
                <div
                  className={cn(
                    "num text-[13px]",
                    r.signals.priceChangePercent >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {signedPct(r.signals.priceChangePercent)}
                </div>
                <div className="num text-[11.5px] text-muted-foreground">
                  vol {r.signals.volumeChangePercent > 0 ? "+" : ""}
                  {Math.round(r.signals.volumeChangePercent)}%
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
