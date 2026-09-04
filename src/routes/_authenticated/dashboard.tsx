import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Inbox } from "lucide-react";
import {
  allItemsQuery,
  eventsForTickersQuery,
  profileQuery,
  touchLastSeen,
  watchlistsQuery,
} from "@/lib/api";
import { EventCard, ImpactMeter } from "@/components/event-card";
import { PageHeader } from "@/components/app-shell";
import { relativeTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — PulseIQ" },
      { name: "description", content: "What changed on your watchlist since your last visit." },
      { property: "og:title", content: "Dashboard — PulseIQ" },
      { property: "og:description", content: "What changed, why, and what deserves attention now." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const profile = useQuery(profileQuery(user.id));
  const items = useQuery(allItemsQuery());
  const lists = useQuery(watchlistsQuery());

  const tickers = useMemo(
    () => [...new Set((items.data ?? []).map((i) => i.ticker))],
    [items.data],
  );
  const events = useQuery({ ...eventsForTickersQuery(tickers), enabled: items.isSuccess });

  // Snapshot the previous visit once, then move the marker forward.
  const [since, setSince] = useState<string | null>(null);
  const touched = useRef(false);
  useEffect(() => {
    if (!profile.data || touched.current) return;
    touched.current = true;
    setSince(profile.data.last_seen_at);
    void touchLastSeen(user.id);
  }, [profile.data, user.id]);

  const sinceMs = since ? new Date(since).getTime() : null;
  const all = events.data ?? [];
  const fresh = sinceMs ? all.filter((e) => new Date(e.occurred_at).getTime() > sinceMs) : [];
  const priority = [...all].sort((a, b) => b.impact - a.impact).slice(0, 3);

  const loading = items.isLoading || events.isLoading || profile.isLoading;

  return (
    <>
      <PageHeader
        title={greeting(profile.data?.full_name ?? null)}
        subtitle={
          since
            ? `Last visit ${relativeTime(since)} · tracking ${tickers.length} ${tickers.length === 1 ? "company" : "companies"} across ${lists.data?.length ?? 0} ${lists.data?.length === 1 ? "watchlist" : "watchlists"}`
            : "Loading your pulse…"
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : tickers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <section>
            <SectionTitle
              label="What changed since your last visit"
              count={fresh.length}
            />
            {fresh.length === 0 ? (
              <div className="panel p-6 text-center text-[13.5px] text-muted-foreground">
                Nothing new since you were last here. The feed below has the full history.
              </div>
            ) : (
              <div className="space-y-3">
                {fresh.map((e) => (
                  <EventCard key={e.id} event={e} isNew />
                ))}
              </div>
            )}

            <SectionTitle label="Everything on your watchlist" count={all.length} className="mt-10" />
            <div className="space-y-3">
              {all.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
              {all.length === 0 ? (
                <div className="panel p-6 text-center text-[13.5px] text-muted-foreground">
                  No signals yet for these tickers.
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <div className="panel p-4">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                Deserves attention
              </h2>
              <ul className="mt-3 space-y-3">
                {priority.map((e) => (
                  <li key={e.id}>
                    <Link
                      to="/stock/$ticker"
                      params={{ ticker: e.ticker }}
                      className="block rounded-md p-2 transition-colors hover:bg-accent/60"
                    >
                      <div className="flex items-center gap-2">
                        <span className="num text-[12px] font-medium">{e.ticker}</span>
                        <span className="ml-auto">
                          <ImpactMeter impact={e.impact} />
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] leading-snug text-muted-foreground">
                        {e.headline}
                      </p>
                    </Link>
                  </li>
                ))}
                {priority.length === 0 ? (
                  <li className="text-[13px] text-muted-foreground">Nothing pressing right now.</li>
                ) : null}
              </ul>
            </div>

            <div className="panel p-4">
              <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
                Your watchlists
              </h2>
              <ul className="mt-3 space-y-1.5">
                {(lists.data ?? []).map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-[13.5px]">
                    <span>{l.name}</span>
                    <span className="num text-[12px] text-muted-foreground">
                      {(items.data ?? []).filter((i) => i.watchlist_id === l.id).length}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/watchlists"
                className="mt-4 flex items-center gap-1 text-[13px] text-primary hover:underline"
              >
                Manage watchlists <ArrowRight className="size-3" />
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function SectionTitle({
  label,
  count,
  className,
}: {
  label: string;
  count: number;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex items-center gap-2 ${className ?? ""}`}>
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      <span className="num rounded-full bg-accent px-1.5 text-[11px] text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center p-12 text-center">
      <Inbox className="size-5 text-muted-foreground" />
      <h2 className="mt-4 text-[15px] font-medium">Your pulse is empty</h2>
      <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-muted-foreground">
        Create a watchlist and add a few companies. PulseIQ will start surfacing what changed and
        why the next time you're here.
      </p>
      <Link
        to="/watchlists"
        className="mt-5 rounded-lg bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Build a watchlist
      </Link>
    </div>
  );
}

function greeting(name: string | null) {
  const hour = new Date().getHours();
  const part = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name.split(" ")[0]}` : part;
}
