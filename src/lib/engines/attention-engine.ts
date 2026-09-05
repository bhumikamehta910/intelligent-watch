/**
 * AttentionEngine
 * ---------------
 * Turns a SnapshotDelta into an explainable attention score.
 *
 *   Price movement      0-40 points
 *   Volume movement     0-25 points
 *   Peer performance    0-20 points
 *   Volatility change   0-15 points
 *                       ----------
 *   Total               0-100
 *
 * Every number below is derived from the snapshot comparison — nothing is
 * hardcoded per ticker and nothing is random.
 */

import { round2, type SnapshotDelta } from "./snapshot-engine";

export type Classification = "Stable" | "Watch" | "Critical";

export type ScoreBreakdown = {
  priceScore: number;
  volumeScore: number;
  peerScore: number;
  volatilityScore: number;
  totalScore: number;
};

export type AttentionResult = {
  ticker: string;
  companyName: string | null;
  score: number;
  classification: Classification;
  breakdown: ScoreBreakdown;
  /** Component-level detail so the UI can show why each bucket scored. */
  components: Array<{
    key: keyof Omit<ScoreBreakdown, "totalScore">;
    label: string;
    points: number;
    max: number;
    detail: string;
  }>;
  explanation: string[];
  verdict: string;
  signals: SnapshotDelta;
};

const MAX = { price: 40, volume: 25, peer: 20, volatility: 15 } as const;

/** Saturating linear scale: `value` maps onto 0..max, capped at `full`. */
function scale(value: number, full: number, max: number): number {
  if (full <= 0) return 0;
  return Math.round(Math.min(Math.abs(value) / full, 1) * max);
}

export function classify(score: number): Classification {
  if (score >= 70) return "Critical";
  if (score >= 40) return "Watch";
  return "Stable";
}

function pctText(value: number): string {
  return `${Math.abs(round2(value))}%`;
}

export function scoreSnapshot(delta: SnapshotDelta): AttentionResult {
  // A 10% move is a full-weight price signal.
  const priceScore = scale(delta.priceChangePercent, 10, MAX.price);
  // Tripling normal volume (+200%) is a full-weight volume signal.
  const volumeScore = scale(delta.volumeChangePercent, 200, MAX.volume);
  // 6% divergence from sector peers is a full-weight peer signal.
  const peerScore = scale(delta.peerRelativeChange, 6, MAX.peer);
  // A 60% change in volatility is a full-weight volatility signal.
  const volatilityScore = scale(delta.volatilityChange, 60, MAX.volatility);

  const totalScore = Math.max(
    0,
    Math.min(100, priceScore + volumeScore + peerScore + volatilityScore),
  );

  const breakdown: ScoreBreakdown = {
    priceScore,
    volumeScore,
    peerScore,
    volatilityScore,
    totalScore,
  };

  const up = delta.priceChangePercent >= 0;
  const outperforming = delta.peerRelativeChange >= 0;

  const components: AttentionResult["components"] = [
    {
      key: "priceScore",
      label: "Price movement",
      points: priceScore,
      max: MAX.price,
      detail: `${up ? "Up" : "Down"} ${pctText(delta.priceChangePercent)} since the previous snapshot`,
    },
    {
      key: "volumeScore",
      label: "Volume movement",
      points: volumeScore,
      max: MAX.volume,
      detail: `Volume ${delta.volumeChangePercent >= 0 ? "up" : "down"} ${pctText(delta.volumeChangePercent)} versus the previous session`,
    },
    {
      key: "peerScore",
      label: "Peer relative",
      points: peerScore,
      max: MAX.peer,
      detail: `${outperforming ? "Ahead of" : "Behind"} sector peers by ${pctText(delta.peerRelativeChange)}`,
    },
    {
      key: "volatilityScore",
      label: "Volatility change",
      points: volatilityScore,
      max: MAX.volatility,
      detail: `Volatility ${delta.volatilityChange >= 0 ? "widened" : "narrowed"} ${pctText(delta.volatilityChange)} (${delta.volatilityBand})`,
    },
  ];

  const explanation = buildExplanation(delta, breakdown);

  return {
    ticker: delta.ticker,
    companyName: delta.companyName,
    score: totalScore,
    classification: classify(totalScore),
    breakdown,
    components,
    explanation,
    verdict: buildVerdict(delta, totalScore),
    signals: delta,
  };
}

/** Plain-language reasons, generated only for signals that actually scored. */
function buildExplanation(delta: SnapshotDelta, breakdown: ScoreBreakdown): string[] {
  const out: string[] = [];

  if (breakdown.priceScore > 0) {
    out.push(
      `Price ${delta.priceChangePercent >= 0 ? "increased" : "fell"} ${pctText(delta.priceChangePercent)}.`,
    );
  }
  if (breakdown.volumeScore > 0) {
    out.push(
      `Volume ${delta.volumeChangePercent >= 0 ? "increased" : "dropped"} ${pctText(delta.volumeChangePercent)}.`,
    );
  }
  if (breakdown.peerScore > 0) {
    out.push(
      delta.peerRelativeChange >= 0
        ? `Outperforming sector peers by ${pctText(delta.peerRelativeChange)}.`
        : `Underperforming sector peers by ${pctText(delta.peerRelativeChange)}.`,
    );
  }
  if (breakdown.volatilityScore > 0) {
    out.push(
      delta.volatilityChange >= 0
        ? `Volatility increased ${breakdown.volatilityScore >= 10 ? "significantly" : "modestly"} (${pctText(delta.volatilityChange)}).`
        : `Volatility settled down ${pctText(delta.volatilityChange)}.`,
    );
  }
  if (out.length === 0) {
    out.push("No meaningful change against the previous snapshot.");
  }
  return out;
}

function buildVerdict(delta: SnapshotDelta, score: number): string {
  const cls = classify(score);
  const dir = delta.priceChangePercent >= 0 ? "buying" : "selling";
  if (cls === "Critical") {
    return `Unusual ${dir} pressure across price, volume and peers — worth a look today.`;
  }
  if (cls === "Watch") {
    return delta.peerRelativeChange >= 0
      ? "Moving with some conviction, but the signal is not yet decisive."
      : "Lagging its sector — keep an eye on it rather than acting.";
  }
  return "Stable. Moving with its sector, nothing company-specific.";
}

/** Score a whole watchlist, highest attention first. */
export function scoreAll(deltas: SnapshotDelta[]): AttentionResult[] {
  return deltas.map(scoreSnapshot).sort((a, b) => b.score - a.score);
}
