/**
 * FinnhubProvider
 * ---------------
 * Thin, server-only wrapper around the Finnhub REST API.
 *
 * The API key never reaches the browser: this module is server-only
 * (`*.server.ts`) and is only ever reached through StockDataService.
 */

export type MarketQuote = {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  /** Daily change in absolute currency terms. */
  change: number;
  /** Daily change in percent. */
  changePercent: number;
  /** Best-available traded volume figure (10-day average when intraday is absent). */
  volume: number;
  /** Intraday range as a percent of price — used as the volatility reading. */
  volatility: number;
  quoteTime: string;
};

export type CompanyInfo = {
  symbol: string;
  name: string | null;
  exchange: string | null;
  currency: string | null;
  industry: string | null;
  logo: string | null;
  marketCap: number | null;
};

export type StockSearchResult = {
  symbol: string;
  description: string;
  type: string;
};

export type MarketStatus = {
  exchange: string;
  isOpen: boolean;
  session: string | null;
  checkedAt: string;
};

const BASE_URL = "https://finnhub.io/api/v1";

export class FinnhubProvider {
  readonly name = "finnhub";

  constructor(private readonly apiKey: string) {}

  static fromEnv(): FinnhubProvider | null {
    // Server-side secret first; VITE_ variant supported for local parity.
    const key = process.env["FINNHUB_API_KEY"] ?? process.env["VITE_FINNHUB_API_KEY"];
    return key ? new FinnhubProvider(key) : null;
  }

  private async request<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url, {
      headers: { "X-Finnhub-Token": this.apiKey, Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`Finnhub ${path} failed with ${res.status}`);
    }
    return (await res.json()) as T;
  }

  /** Symbol lookup for the "add a stock" experience. */
  async searchStocks(query: string): Promise<StockSearchResult[]> {
    if (!query.trim()) return [];
    const data = await this.request<{
      result?: Array<{ symbol: string; description: string; type: string }>;
    }>("/search", { q: query.trim() });
    return (data.result ?? [])
      .filter((r) => r.symbol && !r.symbol.includes("."))
      .slice(0, 12)
      .map((r) => ({ symbol: r.symbol, description: r.description, type: r.type }));
  }

  async getQuote(symbol: string): Promise<MarketQuote> {
    const q = await this.request<{
      c: number;
      d: number | null;
      dp: number | null;
      h: number;
      l: number;
      o: number;
      pc: number;
      t: number;
    }>("/quote", { symbol });

    if (!q || !q.c) throw new Error(`Finnhub returned no price for ${symbol}`);

    const volume = await this.getVolume(symbol);
    const volatility = q.c > 0 ? ((q.h - q.l) / q.c) * 100 : 0;

    return {
      symbol,
      price: q.c,
      open: q.o,
      high: q.h,
      low: q.l,
      previousClose: q.pc,
      change: q.d ?? q.c - q.pc,
      changePercent: q.dp ?? (q.pc ? ((q.c - q.pc) / q.pc) * 100 : 0),
      volume,
      volatility,
      quoteTime: new Date((q.t ? q.t * 1000 : Date.now())).toISOString(),
    };
  }

  /** Finnhub's free quote endpoint has no volume field; use the metrics endpoint. */
  private async getVolume(symbol: string): Promise<number> {
    try {
      const m = await this.request<{ metric?: Record<string, number | null> }>("/stock/metric", {
        symbol,
        metric: "all",
      });
      const millions =
        m.metric?.["10DayAverageTradingVolume"] ??
        m.metric?.["3MonthAverageTradingVolume"] ??
        null;
      return millions ? Math.round(millions * 1_000_000) : 0;
    } catch {
      return 0;
    }
  }

  async getCompanyInfo(symbol: string): Promise<CompanyInfo> {
    const p = await this.request<{
      name?: string;
      exchange?: string;
      currency?: string;
      finnhubIndustry?: string;
      logo?: string;
      marketCapitalization?: number;
    }>("/stock/profile2", { symbol });

    return {
      symbol,
      name: p.name ?? null,
      exchange: p.exchange ?? null,
      currency: p.currency ?? null,
      industry: p.finnhubIndustry ?? null,
      logo: p.logo ?? null,
      marketCap: p.marketCapitalization ?? null,
    };
  }

  /** Sector peers, used to compute peer-relative performance. */
  async getPeers(symbol: string): Promise<string[]> {
    try {
      const peers = await this.request<string[]>("/stock/peers", { symbol });
      return (peers ?? []).filter((p) => p && p !== symbol).slice(0, 4);
    } catch {
      return [];
    }
  }

  async getMarketStatus(exchange = "US"): Promise<MarketStatus> {
    const s = await this.request<{ isOpen?: boolean; session?: string | null }>(
      "/stock/market-status",
      { exchange },
    );
    return {
      exchange,
      isOpen: Boolean(s.isOpen),
      session: s.session ?? null,
      checkedAt: new Date().toISOString(),
    };
  }
}
