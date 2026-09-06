import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Server functions for market data. UI components call these — never Finnhub
 * directly. Everything goes through StockDataService.
 */

export const searchStocks = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ query: z.string().min(1).max(40) }).parse(input))
  .handler(async ({ data }) => {
    const { StockDataService } = await import("@/services/stockDataService.server");
    return StockDataService.create().searchStocks(data.query);
  });

export const getQuote = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ symbol: z.string().min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const { StockDataService } = await import("@/services/stockDataService.server");
    const service = StockDataService.create();
    const quote = await service.getQuote(data.symbol);
    return { mode: quote ? ("live" as const) : ("demo" as const), quote };
  });

export const getCompanyInfo = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ symbol: z.string().min(1).max(20) }).parse(input))
  .handler(async ({ data }) => {
    const { StockDataService } = await import("@/services/stockDataService.server");
    return StockDataService.create().getCompanyInfo(data.symbol);
  });

export const getMarketStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { StockDataService } = await import("@/services/stockDataService.server");
  return StockDataService.create().getMarketStatus("US");
});
