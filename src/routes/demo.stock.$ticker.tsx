import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  DEMO_ACTIVITY_DESC,
  DEMO_WATCHLIST,
  demoAttentionFor,
  demoCompany,
} from "@/lib/demo-data";
import { relativeTime, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/score-ring";

export const Route = createFileRoute("/demo/stock/$ticker")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} — PulseIQ demo` },
      {
        name: "description",
        content: `Attention score, explanations and event timeline for ${params.ticker} in the PulseIQ demo workspace.`,
      },
      { property: "og:title", content: `${params.ticker} — PulseIQ demo` },
      {
        property: "og:description",
        content: `Why ${params.ticker} moved, and how much it should matter.`,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoStock,
});

function DemoStock() {
  const { ticker } = Route.useParams();
  const snap = demoCompany(ticker);
  const attention = demoAttentionFor(ticker);
  const events = DEMO_ACTIVITY_DESC.filter((e) => e.ticker === ticker);

  if (!snap) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="text-[15px] font-medium">{ticker} isn't in the demo workspace</h1>
        <Link to="/demo" className="mt-4 inline-block text-[13.5px] text-primary hover:underline">
          Back to the demo
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        to="/demo"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {DEMO_WATCHLIST.name}
      </Link>

      <div className="panel flex flex-wrap items-center gap-5 p-5">
        {attention ? <ScoreRing score={attention.score} size={64} /> : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{snap.companyName}</h1>
          <p className="num mt-1 text-[13px] text-muted-foreground">{snap.ticker}</p>
        </div>
        <div className="ml-auto text-right">
          <div className="num text-2xl font-semibold">₹{snap.price.toLocaleString("en-IN")}</div>
          <div
            className={cn(
              "num text-[14px]",
              snap.changePct >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {signedPct(snap.changePct)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat label="Volume vs normal" value={`${snap.volumeChangePct > 0 ? "+" : ""}${snap.volumeChangePct}%`} />
        <Stat label="Against peers" value={signedPct(snap.peerRelativePct)} />
        <Stat label="Volatility" value={snap.volatility} />
      </div>

      {attention ? (
        <div className="panel mt-3 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              Why this score
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">{attention.verdict}</p>
          <ul className="mt-3 space-y-1.5">
            {attention.reasons.map((r) => (
              <li key={r} className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <h2 className="mb-3 mt-10 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        Activity log
      </h2>
      <div className="space-y-3">
        {events.map((e) => (
          <article key={e.id} className="panel p-4">
            <div className="flex items-center gap-2.5">
              <span className="text-[12px] uppercase tracking-wide text-muted-foreground">
                {e.category}
              </span>
              <span className="ml-auto flex items-center gap-3">
                <span
                  className={cn(
                    "num text-[13px]",
                    (e.priceChangePct ?? 0) >= 0 ? "text-positive" : "text-negative",
                  )}
                >
                  {signedPct(e.priceChangePct)}
                </span>
                <span className="text-[12px] text-muted-foreground">
                  {relativeTime(e.occurredAt)}
                </span>
              </span>
            </div>
            <h3 className="mt-3 text-[15px] font-medium leading-snug">{e.headline}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{e.summary}</p>
          </article>
        ))}
        {events.length === 0 ? (
          <p className="panel p-6 text-center text-[13.5px] text-muted-foreground">
            No recorded activity for this company yet.
          </p>
        ) : null}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4">
      <div className="text-[12px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="num mt-1 text-[16px] capitalize">{value}</div>
    </div>
  );
}
