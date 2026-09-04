import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;
export type Watchlist = Tables<"watchlists">;
export type WatchlistItem = Tables<"watchlist_items">;
export type MarketEvent = Tables<"market_events">;

export type ItemWithList = WatchlistItem & { watchlists: { id: string; name: string } | null };

/* ---------------- queries ---------------- */

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const watchlistsQuery = () =>
  queryOptions({
    queryKey: ["watchlists"],
    queryFn: async (): Promise<Watchlist[]> => {
      const { data, error } = await supabase
        .from("watchlists")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const allItemsQuery = () =>
  queryOptions({
    queryKey: ["watchlist_items"],
    queryFn: async (): Promise<ItemWithList[]> => {
      const { data, error } = await supabase
        .from("watchlist_items")
        .select("*, watchlists(id, name)")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ItemWithList[];
    },
  });

export const eventsForTickersQuery = (tickers: string[]) =>
  queryOptions({
    queryKey: ["events", [...tickers].sort()],
    queryFn: async (): Promise<MarketEvent[]> => {
      if (tickers.length === 0) return [];
      const { data, error } = await supabase
        .from("market_events")
        .select("*")
        .in("ticker", tickers)
        .order("occurred_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return data ?? [];
    },
  });

export const tickerEventsQuery = (ticker: string) =>
  queryOptions({
    queryKey: ["events", "ticker", ticker],
    queryFn: async (): Promise<MarketEvent[]> => {
      const { data, error } = await supabase
        .from("market_events")
        .select("*")
        .eq("ticker", ticker)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const knownTickersQuery = () =>
  queryOptions({
    queryKey: ["known_tickers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_events")
        .select("ticker, company_name")
        .order("ticker", { ascending: true });
      if (error) throw error;
      const map = new Map<string, string>();
      for (const row of data ?? []) {
        if (!map.has(row.ticker)) map.set(row.ticker, row.company_name ?? row.ticker);
      }
      return [...map].map(([ticker, company_name]) => ({ ticker, company_name }));
    },
  });

/* ---------------- mutations ---------------- */

export async function createWatchlist(userId: string, name: string) {
  const { data, error } = await supabase
    .from("watchlists")
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameWatchlist(id: string, name: string) {
  const { error } = await supabase.from("watchlists").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteWatchlist(id: string) {
  const { error } = await supabase.from("watchlists").delete().eq("id", id);
  if (error) throw error;
}

export async function addItem(watchlistId: string, ticker: string, companyName: string | null) {
  const { error } = await supabase.from("watchlist_items").insert({
    watchlist_id: watchlistId,
    ticker: ticker.trim().toUpperCase(),
    company_name: companyName,
  });
  if (error) throw error;
}

export async function removeItem(id: string) {
  const { error } = await supabase.from("watchlist_items").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProfile(userId: string, values: { full_name: string }) {
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  if (error) throw error;
}

export async function touchLastSeen(userId: string) {
  await supabase.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", userId);
}
