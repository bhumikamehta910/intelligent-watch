import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, Bell, Layers, PlayCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseIQ — Know what changed. Understand what matters." },
      {
        name: "description",
        content:
          "PulseIQ is an intelligent market watchlist that shows what changed since your last visit, why it changed, and what deserves attention now. Explore the live demo — no account needed.",
      },
      { property: "og:title", content: "PulseIQ — Know what changed. Understand what matters." },
      {
        property: "og:description",
        content:
          "Traditional watchlists show prices. PulseIQ shows what deserves your attention. Explore the demo without signing up.",
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
    title: "Since you were away",
    body: "A single feed of everything that moved on your watchlist since your last visit — nothing repeated, nothing missed.",
  },
  {
    icon: Sparkles,
    title: "Attention scores",
    body: "Every company gets a score from price, volume, peer behaviour and volatility, so the list ranks itself.",
  },
  {
    icon: Layers,
    title: "Explanations & replay",
    body: "Plain-language reasons behind each score, plus a timeline you can scrub to replay how the story built up.",
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
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/demo"
            className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Demo
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-accent"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-16 pt-20 text-center">
        <p className="text-[12px] uppercase tracking-[0.18em] text-primary">Intelligent watchlist</p>
        <h1 className="mt-4 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          PulseIQ
        </h1>
        <p className="mt-4 text-balance text-xl font-medium tracking-tight text-foreground/90 sm:text-2xl">
          Know what changed. Understand what matters.
        </p>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground">
          Traditional watchlists show prices.
          <br />
          PulseIQ shows what deserves your attention.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/demo"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <PlayCircle className="size-4" /> Explore Demo
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-[14px] transition-colors hover:bg-accent"
          >
            Sign In <ArrowRight className="size-4" />
          </Link>
        </div>
        <p className="mt-4 text-[12.5px] text-muted-foreground">
          The demo opens instantly — no account, no email verification.
        </p>
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
