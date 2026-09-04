import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Bell, Layers, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseIQ — Know what changed. Understand what matters." },
      {
        name: "description",
        content:
          "PulseIQ is an intelligent market watchlist that shows what changed since your last visit, why it changed, and what deserves attention now.",
      },
      { property: "og:title", content: "PulseIQ — Know what changed. Understand what matters." },
      {
        property: "og:description",
        content:
          "An intelligent market watchlist built for signal, not tickers. See what changed, why, and what matters now.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Bell,
    title: "What changed",
    body: "A single feed of everything that moved on your watchlist since you were last here — nothing repeated, nothing missed.",
  },
  {
    icon: Sparkles,
    title: "Why it changed",
    body: "Each event carries a plain-language explanation of the mechanism behind the move, not just a headline.",
  },
  {
    icon: Layers,
    title: "What matters now",
    body: "Events are scored for impact and ranked, so the three things worth your attention sit at the top.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen halo">
      <header className="mx-auto flex h-16 max-w-6xl items-center px-5">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Activity className="size-3.5" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">PulseIQ</span>
        </div>
        <Link
          to="/auth"
          className="ml-auto rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-accent"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-16 pt-20 text-center">
        <p className="text-[12px] uppercase tracking-[0.18em] text-primary">Intelligent watchlist</p>
        <h1 className="mt-4 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Know what changed.
          <br />
          Understand what matters.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
          PulseIQ isn't a price ticker. It tracks the companies you follow and tells you what moved
          since your last visit, the reason behind it, and how much it should matter to you.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start tracking <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="rounded-lg border border-border px-4 py-2.5 text-[14px] transition-colors hover:bg-accent"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-3 px-5 pb-24 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="panel p-5 text-left">
            <Icon className="size-4 text-primary" />
            <h2 className="mt-3 text-[15px] font-medium">{title}</h2>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
