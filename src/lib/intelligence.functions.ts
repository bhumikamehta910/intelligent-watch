import { createServerFn } from "@tanstack/react-start";

/**
 * Public, read-only intelligence endpoint.
 *
 * All market data flows through StockDataService: it fetches live quotes from
 * the configured provider (Finnhub), persists them as snapshots, and runs the
 * SnapshotEngine + AttentionEngine. If no provider is configured or the
 * provider fails, it falls back to the stored demo snapshots.
 */
export const getIntelligence = createServerFn({ method: "GET" }).handler(async () => {
  const { StockDataService } = await import("@/services/stockDataService.server");
  const service = StockDataService.create();

  if (!service.hasLiveProvider) {
    return service.storedIntelligence("No market data provider configured");
  }

  try {
    return await service.refreshIntelligence();
  } catch (error) {
    console.error("[intelligence] live refresh failed, falling back to demo data", error);
    return service.storedIntelligence("Live market data is temporarily unavailable");
  }
});
