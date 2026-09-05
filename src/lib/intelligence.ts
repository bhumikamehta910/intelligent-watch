import { queryOptions } from "@tanstack/react-query";
import { getIntelligence } from "@/lib/intelligence.functions";
import type { AttentionResult } from "@/lib/engines/attention-engine";

export type { AttentionResult };

export const intelligenceQuery = () =>
  queryOptions({
    queryKey: ["intelligence"],
    queryFn: () => getIntelligence(),
    staleTime: 60_000,
  });

export function findResult(results: AttentionResult[], ticker: string) {
  return results.find((r) => r.ticker.toUpperCase() === ticker.toUpperCase());
}
