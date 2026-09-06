import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DEMO_WATCHLIST, demoActivityFor } from "@/lib/demo-data";
import { intelligenceQuery, findResult } from "@/lib/intelligence";
import { relativeTime, signedPct } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/score-ring";
import { ScoreBreakdown } from "@/components/score-breakdown";
import { DataModeBadge } from "@/components/data-mode-badge";

export const Route = createFileRoute("/demo/stock/$ticker")({
  loader: ({ context }) => context.queryClient.ensureQueryData(intelligenceQuery()),
  errorComponent: () => (
    <div className="panel p-10 text-center text-[13.5px] text-muted-foreground">
      This company's intelligence data could not be loaded. Please refresh.
    </div>
  ),
  notFoundComponent: () => (
    <div className="panel p-10 text-center text-[13.5px]">Company not found in the demo.</div>
  ),
  head: ({ params }) => ({
    meta: [
      { title: `${params.ticker} — PulseIQ demo` },
      {
        name: "description",
        content: `Calculated attention score, score breakdown and event timeline for ${params.ticker} in the PulseIQ demo workspace.`,
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
  const { data } = useSuspenseQuery(intelligenceQuery());
  const result = findResult(data.results, ticker);
  const events = demoActivityFor(ticker);

  if (!result) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="text-[15px] font-medium">{ticker} isn't in the demo workspace</h1>
        <Link to="/demo" className="mt-4 inline-block text-[13.5px] text-primary hover:underline">
          Back to the demo
        </Link>
      </div>
    );
  }

  const s = result.signals;

  return (
    <>
      <Link
        to="/demo"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> {DEMO_WATCHLIST.name}
      </Link>

      <div className="panel flex flex-wrap items-center gap-5 p-5">
        <ScoreRing score={result.score} size={64} />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {result.companyName ?? result.ticker}
          </h1>
          <p className="num mt-1 flex items-center gap-2 text-[13px] text-muted-foreground">
            {result.ticker} · {result.classification}
            <DataModeBadge mode={data.mode} reason={data.reason} />
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="num text-2xl font-semibold">₹{s.latest.price.toLocaleString("en-IN")}</div>
          <div
            className={cn(
              "num text-[14px]",
              s.priceChangePercent >= 0 ? "text-positive" : "text-negative",
            )}
          >
            {signedPct(s.priceChangePercent)}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Volume vs previous"
          value={`${s.volumeChangePercent > 0 ? "+" : ""}${Math.round(s.volumeChangePercent)}%`}
        />
        <Stat label="Against peers" value={signedPct(s.peerRelativeChange)} />
        <Stat label="Volatility" value={`${s.volatilityBand} (${signedPct(s.volatilityChange)})`} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
              Why this score
            </h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">{result.verdict}</p>
          <ul className="mt-3 space-y-1.5">
            {result.explanation.map((r) => (
              <li key={r} className="flex items-center gap-2 text-[13.5px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="panel p-5">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            Score breakdown
          </h2>
          <ScoreBreakdown result={result} className="mt-3" />
        </div>
      </div>

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
                <span className="text-[12px] text-muted-foreground">
                  {relativeTime(e.occurredAt)}
                </span>
              </span>
            </div>
            <h3 className="mt-3 text-[15px] font-medium leading-snug">{e.headline}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{e.summary}</p>
            <p className="mt-3 border-t border-border/60 pt-2 text-[12px] text-muted-foreground">
              {e.source}
            </p>
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
