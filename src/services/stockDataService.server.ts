/**
 * StockDataService
 * ----------------
 * The single door between PulseIQ and any market data provider.
 *
 * UI components never talk to Finnhub. They call server functions, which call
 * this service, which either:
 *   - fetches live data through FinnhubProvider, persists it as a snapshot and
 *     scores it  ("live" mode), or
 *   - falls back to the snapshots already stored in the database ("demo" mode)
 *     when no API key is configured or the provider is unavailable.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildDeltas, toSnapshot, round2 } from "@/lib/engines/snapshot-engine";
import { scoreAll, type AttentionResult } from "@/lib/engines/attention-engine";
import {
  FinnhubProvider,
  type CompanyInfo,
  type MarketQuote,
  type MarketStatus,
  type StockSearchResult,
} from "./providers/finnhub.server";

export type DataMode = "live" | "demo";

export type IntelligencePayload = {
  mode: DataMode;
  /** Why demo mode is active, when it is. */
  reason: string | null;
  marketStatus: MarketStatus | null;
  generatedAt: string;
  results: AttentionResult[];
};

/** The demo watchlist, mapped onto tradeable provider symbols. */
export const TRACKED_TICKERS = [
  { ticker: "TCS", symbol: "TCS.NS", fallbackSymbol: "INFY", companyName: "Tata Consultancy Services" },
  { ticker: "INFY", symbol: "INFY.NS", fallbackSymbol: "INFY", companyName: "Infosys" },
  { ticker: "RELIANCE", symbol: "RELIANCE.NS", fallbackSymbol: "RELIANCE.NS", companyName: "Reliance Industries" },
  { ticker: "HDFCBANK", symbol: "HDB", fallbackSymbol: "HDB", companyName: "HDFC Bank" },
  { ticker: "ICICIBANK", symbol: "IBN", fallbackSymbol: "IBN", companyName: "ICICI Bank" },
] as const;

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export class StockDataService {
  private constructor(private readonly provider: FinnhubProvider | null) {}

  static create(): StockDataService {
    return new StockDataService(FinnhubProvider.fromEnv());
  }

  get hasLiveProvider(): boolean {
    return this.provider !== null;
  }

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!this.provider) return [];
    try {
      return await this.provider.searchStocks(query);
    } catch {
      return [];
    }
  }

  async getQuote(symbol: string): Promise<MarketQuote | null> {
    if (!this.provider) return null;
    try {
      return await this.provider.getQuote(symbol);
    } catch {
      return null;
    }
  }

  async getCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
    if (!this.provider) return null;
    try {
      return await this.provider.getCompanyInfo(symbol);
    } catch {
      return null;
    }
  }

  async getMarketStatus(exchange = "US"): Promise<MarketStatus | null> {
    if (!this.provider) return null;
    try {
      return await this.provider.getMarketStatus(exchange);
    } catch {
      return null;
    }
  }

  /**
   * Live path: pull a quote per tracked ticker, turn it into a snapshot row,
   * persist it, then score newest-vs-previous through the engines.
   */
  async refreshIntelligence(): Promise<IntelligencePayload> {
    if (!this.provider) {
      return this.storedIntelligence("No market data provider configured");
    }

    const provider = this.provider;
    let marketStatus: MarketStatus | null = null;
    try {
      marketStatus = await provider.getMarketStatus("US");
    } catch {
      marketStatus = null;
    }

    const rows: Array<{
      ticker: string;
      company_name: string | null;
      price: number;
      volume: number;
      peer_relative_change: number;
      volatility: number;
      snapshot_time: string;
    }> = [];

    for (const entry of TRACKED_TICKERS) {
      const quote =
        (await this.getQuote(entry.symbol)) ?? (await this.getQuote(entry.fallbackSymbol));
      if (!quote) continue;

      const info = await this.getCompanyInfo(quote.symbol);
      const peerRelative = await this.peerRelativeChange(quote);

      rows.push({
        ticker: entry.ticker,
        company_name: info?.name ?? entry.companyName,
        price: round2(quote.price),
        volume: quote.volume,
        peer_relative_change: round2(peerRelative),
        volatility: round2(quote.volatility),
        snapshot_time: quote.quoteTime,
      });
    }

    if (rows.length === 0) {
      return this.storedIntelligence("Market data provider returned no usable quotes");
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("stock_snapshots").insert(rows);
    } catch (error) {
      console.error("[stockDataService] failed to persist snapshots", error);
    }

    const payload = await this.storedIntelligence(null);
    return { ...payload, mode: "live", reason: null, marketStatus };
  }

  /** Average peer daily change vs this symbol's daily change. */
  private async peerRelativeChange(quote: MarketQuote): Promise<number> {
    if (!this.provider) return 0;
    const peers = await this.provider.getPeers(quote.symbol);
    if (peers.length === 0) return 0;

    const changes: number[] = [];
    for (const peer of peers) {
      const q = await this.getQuote(peer);
      if (q) changes.push(q.changePercent);
    }
    if (changes.length === 0) return 0;
    const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
    return quote.changePercent - avg;
  }

  /** Demo / fallback path: score whatever snapshots are already persisted. */
  async storedIntelligence(reason: string | null): Promise<IntelligencePayload> {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("stock_snapshots")
      .select("ticker, company_name, price, volume, peer_relative_change, volatility, snapshot_time")
      .order("snapshot_time", { ascending: false })
      .limit(400);
    if (error) throw error;

    const results = scoreAll(buildDeltas((data ?? []).map(toSnapshot)));
    await this.persistScores(results);

    return {
      mode: "demo",
      reason: reason ?? "Showing stored demo snapshots",
      marketStatus: null,
      generatedAt: new Date().toISOString(),
      results,
    };
  }

  private async persistScores(results: AttentionResult[]): Promise<void> {
    if (results.length === 0) return;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("attention_scores").upsert(
        results.map((r) => ({
          ticker: r.ticker,
          score: r.score,
          classification: r.classification,
          explanation: r.explanation,
          breakdown: r.breakdown,
          verdict: r.verdict,
          generated_at: new Date().toISOString(),
        })),
        { onConflict: "ticker" },
      );
    } catch (error) {
      console.error("[stockDataService] failed to persist attention scores", error);
    }
  }
}
