import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { buildDeltas, toSnapshot } from "@/lib/engines/snapshot-engine";
import { scoreAll, type AttentionResult } from "@/lib/engines/attention-engine";

/**
 * Public, read-only intelligence endpoint.
 *
 * Reads persisted snapshots, runs the SnapshotEngine (previous vs latest) and
 * the AttentionEngine (score + breakdown + explanation), then persists the
 * generated scores back into `attention_scores` so the calculation is durable
 * and auditable rather than living in the UI.
 */
export const getIntelligence = createServerFn({ method: "GET" }).handler(
  async (): Promise<AttentionResult[]> => {
    const url = process.env["SUPABASE_URL"]!;
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

    const supabasePublic = createClient<Database>(url, key, {
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

    const { data, error } = await supabasePublic
      .from("stock_snapshots")
      .select("ticker, company_name, price, volume, peer_relative_change, volatility, snapshot_time")
      .order("snapshot_time", { ascending: false })
      .limit(400);
    if (error) throw error;

    const results = scoreAll(buildDeltas((data ?? []).map(toSnapshot)));

    // Persist the generated scores (service role: these are shared, non-user rows).
    if (results.length > 0) {
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
      } catch (persistError) {
        console.error("[intelligence] failed to persist attention scores", persistError);
      }
    }

    return results;
  },
);
