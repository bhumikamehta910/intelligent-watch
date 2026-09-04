import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight, Gauge, History, Sparkles } from "lucide-react";
import {
  DEMO_ACTIVITY_DESC,
  DEMO_ATTENTION,
  DEMO_SINCE_AWAY,
  DEMO_SNAPSHOTS,
  DEMO_WATCHLIST,
  demoCompany,
  type DemoActivity,
} from "@/lib/demo-data";
import { relativeTime, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Demo workspace — PulseIQ" },
      {
        name: "description",
        content:
          "A pre-populated PulseIQ workspace: attention scores, explanations and a timeline replay for an Indian large-cap watchlist. No account needed.",
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
  return (
    <>
      <div className="mb-7">
        <h1 className="text-2xl font-semibold tracking-tight">{DEMO_WATCHLIST.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last visit {relativeTime(DEMO_WATCHLIST.lastSeenAt)} · {DEMO_SNAPSHOTS.length} companies ·
          sample data so you can evaluate PulseIQ without an account
        </p>
      </div>

      <SinceYouWereAway />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <AttentionScores />
          <TimelineReplay />
        </div>
        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Snapshots />
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

function SinceYouWereAway() {
  const moved = DEMO_SINCE_AWAY.length;
  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <History className="size-4 text-primary" />
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Since you were away
        </h2>
        <span className="num rounded-full bg-accent px-1.5 text-[11px] text-muted-foreground">
          {moved}
        </span>
      </div>
      <p className="mt-3 text-[15px] leading-relaxed">
        In the {relativeTime(DEMO_WATCHLIST.lastSeenAt).replace(" ago", "")} you were away,{" "}
        <strong className="font-medium">{moved} things happened</strong> on this watchlist.{" "}
        <strong className="font-medium text-positive">TCS</strong> is the one that matters — an 8%
        move on 3.2x volume, ahead of every peer. Reliance is the one to watch on the downside.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {DEMO_SINCE_AWAY.slice(0, 3).map((e) => (
          <Link
            key={e.id}
            to="/demo/stock/$ticker"
            params={{ ticker: e.ticker }}
            className="rounded-lg border border-border/70 bg-surface-raised/40 p-3 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              <span className="num text-[12px] font-medium">{e.ticker}</span>
              <span
                className={cn(
                  "num ml-auto text-[12.5px]",
                  (e.priceChangePct ?? 0) >= 0 ? "text-positive" : "text-negative",
                )}
              >
                {signedPct(e.priceChangePct)}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{e.headline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 2 + 3. Attention scores & explanations ---------------- */

function AttentionScores() {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Gauge className="size-4 text-primary" />
        <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Attention scores
        </h2>
      </div>
      <div className="space-y-3">
        {DEMO_ATTENTION.map((a) => {
          const snap = demoCompany(a.ticker);
          return (
            <article key={a.ticker} className="panel group p-4">
              <div className="flex flex-wrap items-center gap-3">
                <ScoreRing score={a.score} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="num text-[13px] font-medium">{a.ticker}</span>
                    <span className="truncate text-[13px] text-muted-foreground">
                      {snap?.companyName}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[14px] leading-snug">{a.verdict}</p>
                </div>
                <div className="ml-auto text-right">
                  <div
                    className={cn(
                      "num text-[15px]",
                      (snap?.changePct ?? 0) >= 0 ? "text-positive" : "text-negative",
                    )}
                  >
                    {signedPct(snap?.changePct ?? null)}
                  </div>
                  <div className="num text-[12px] text-muted-foreground">
                    ₹{snap?.price.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
                <Sparkles className="size-3.5 text-primary" />
                {a.reasons.map((r) => (
                  <span
                    key={r}
                    className="rounded-full border border-border/70 bg-accent/50 px-2.5 py-1 text-[12.5px] text-muted-foreground"
                  >
                    {r}
                  </span>
                ))}
                <Link
                  to="/demo/stock/$ticker"
                  params={{ ticker: a.ticker }}
                  className="ml-auto flex items-center gap-1 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  Detail <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const tone =
    score >= 80 ? "text-negative" : score >= 60 ? "text-primary" : "text-muted-foreground";
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-border" strokeWidth="3" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn("stroke-current", tone)}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`}
        />
      </svg>
      <span className={cn("num absolute text-[14px] font-medium", tone)}>{score}</span>
    </span>
  );
}

/* ---------------- 4. Timeline replay ---------------- */

function TimelineReplay() {
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
          <TimelineRow key={e.id} event={e} />
        ))}
      </ol>
    </section>
  );
}

function TimelineRow({ event }: { event: DemoActivity }) {
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
                (event.priceChangePct ?? 0) >= 0 ? "text-positive" : "text-negative",
              )}
            >
              {signedPct(event.priceChangePct)}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {relativeTime(event.occurredAt)}
            </span>
          </span>
        </div>
        <h3 className="mt-3 text-[15px] font-medium leading-snug">{event.headline}</h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{event.summary}</p>
        <p className="mt-3 border-t border-border/60 pt-2 text-[12px] text-muted-foreground">
          Attention weight {event.impact} · {event.source}
        </p>
      </article>
    </li>
  );
}

/* ---------------- snapshots ---------------- */

function Snapshots() {
  return (
    <div className="panel p-4">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        Snapshot
      </h2>
      <ul className="mt-3 space-y-2.5">
        {DEMO_SNAPSHOTS.map((s) => (
          <li key={s.ticker}>
            <Link
              to="/demo/stock/$ticker"
              params={{ ticker: s.ticker }}
              className="flex items-center gap-2 rounded-md p-1.5 transition-colors hover:bg-accent/60"
            >
              <div className="min-w-0">
                <div className="num text-[12.5px] font-medium">{s.ticker}</div>
                <div className="truncate text-[12px] text-muted-foreground">{s.companyName}</div>
              </div>
              <div className="ml-auto text-right">
                <div
                  className={cn(
                    "num text-[13px]",
                    s.changePct >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {signedPct(s.changePct)}
                </div>
                <div className="num text-[11.5px] text-muted-foreground">
                  vol {s.volumeChangePct > 0 ? "+" : ""}
                  {s.volumeChangePct}%
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
