/**
 * ChangeEngine
 * ------------
 * Turns snapshot deltas + score movement into *meaningful* events.
 *
 * PulseIQ deliberately stays quiet: an event is only generated when a change
 * crosses a threshold that a human would actually care about.
 *
 *   Price change      > 1%
 *   Volume change     > 20%
 *   Attention score   moves by 15+ points
 *
 * Everything below is derived — no randomness, no hardcoded events.
 */

import type { AttentionResult } from "./attention-engine";
import { round2 } from "./snapshot-engine";

export const THRESHOLDS = {
  pricePercent: 1,
  volumePercent: 20,
  scorePoints: 15,
} as const;

export type EventCategory =
  | "Price Breakout"
  | "Volume Spike"
  | "Momentum Shift"
  | "Attention Upgrade"
  | "Attention Downgrade"
  | "Unusual Activity";

export type MeaningfulEvent = {
  id: string;
  ticker: string;
  companyName: string | null;
  category: EventCategory;
  direction: "positive" | "negative" | "neutral";
  headline: string;
  /** Why this crossed the noise floor. */
  reason: string;
  /** How strongly it deserves attention (0-100) — reuses the attention score. */
  importance: number;
  occurredAt: string;
};

function pct(value: number): string {
  return `${Math.abs(round2(value))}%`;
}

/**
 * Detect events for a single company by comparing the freshly calculated
 * result against the previously stored attention score.
 */
export function detectEvents(
  result: AttentionResult,
  previousScore: number | null,
): MeaningfulEvent[] {
  const events: MeaningfulEvent[] = [];
  const s = result.signals;
  const at = s.latest.snapshotTime;
  const base = {
    ticker: result.ticker,
    companyName: result.companyName,
    importance: result.score,
    occurredAt: at,
  };

  const priceMoved = Math.abs(s.priceChangePercent) > THRESHOLDS.pricePercent;
  const volumeMoved = Math.abs(s.volumeChangePercent) > THRESHOLDS.volumePercent;

  if (priceMoved) {
    const up = s.priceChangePercent >= 0;
    events.push({
      ...base,
      id: `${result.ticker}-price`,
      category: "Price Breakout",
      direction: up ? "positive" : "negative",
      headline: `${result.ticker} ${up ? "broke out" : "broke down"} ${pct(s.priceChangePercent)}`,
      reason: `Price ${up ? "rose" : "fell"} ${pct(s.priceChangePercent)} since the previous reading — past the ${THRESHOLDS.pricePercent}% noise floor.`,
    });
  }

  if (volumeMoved) {
    const up = s.volumeChangePercent >= 0;
    events.push({
      ...base,
      id: `${result.ticker}-volume`,
      category: "Volume Spike",
      direction: up ? "positive" : "neutral",
      headline: `${result.ticker} traded ${pct(s.volumeChangePercent)} ${up ? "above" : "below"} its previous volume`,
      reason: `Volume ${up ? "surged" : "dried up"} ${pct(s.volumeChangePercent)} — participation changed, not just price.`,
    });
  }

  // Price and volume moving together with peer divergence = conviction, not drift.
  if (priceMoved && volumeMoved && Math.abs(s.peerRelativeChange) >= 1) {
    events.push({
      ...base,
      id: `${result.ticker}-momentum`,
      category: "Momentum Shift",
      direction: s.priceChangePercent >= 0 ? "positive" : "negative",
      headline: `${result.ticker} is moving ${s.peerRelativeChange >= 0 ? "ahead of" : "behind"} its sector`,
      reason: `Price and volume both moved while the stock diverged ${pct(s.peerRelativeChange)} from peers — a genuine shift rather than sector drift.`,
    });
  }

  if (previousScore !== null) {
    const diff = result.score - previousScore;
    if (Math.abs(diff) >= THRESHOLDS.scorePoints) {
      const up = diff > 0;
      events.push({
        ...base,
        id: `${result.ticker}-score`,
        category: up ? "Attention Upgrade" : "Attention Downgrade",
        direction: up ? "positive" : "neutral",
        headline: `${result.ticker} attention ${up ? "upgraded" : "downgraded"} to ${result.score} (${result.classification})`,
        reason: `Attention score ${up ? "rose" : "dropped"} ${Math.abs(diff)} points from ${previousScore} — ${up ? "it now deserves a look" : "the case for attention weakened"}.`,
      });
    }
  }

  // Volume exploding without a matching price move is the classic tell.
  if (volumeMoved && !priceMoved && Math.abs(s.volumeChangePercent) >= 50) {
    events.push({
      ...base,
      id: `${result.ticker}-unusual`,
      category: "Unusual Activity",
      direction: "neutral",
      headline: `${result.ticker} saw unusual activity with little price movement`,
      reason: `Volume changed ${pct(s.volumeChangePercent)} while price barely moved (${pct(s.priceChangePercent)}) — someone is positioning quietly.`,
    });
  }

  return events;
}

/** Detect across a whole watchlist, most important first. */
export function detectAll(
  results: AttentionResult[],
  previousScores: Record<string, number>,
): MeaningfulEvent[] {
  return results
    .flatMap((r) => detectEvents(r, previousScores[r.ticker] ?? null))
    .sort((a, b) => b.importance - a.importance || +new Date(b.occurredAt) - +new Date(a.occurredAt));
}
