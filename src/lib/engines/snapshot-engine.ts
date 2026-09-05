/**
 * SnapshotEngine
 * --------------
 * Owns everything about stock snapshots: their shape, how they are persisted,
 * and how a latest snapshot is compared against the one before it.
 *
 * It is deliberately pure/deterministic — no randomness, no hardcoded results.
 * Given the same two snapshots it always produces the same deltas.
 */

export type Snapshot = {
  ticker: string;
  companyName: string | null;
  price: number;
  volume: number;
  /** How the stock moved relative to its sector peers, in percent. */
  peerRelativeChange: number;
  /** Volatility reading (e.g. average true range as a % of price). */
  volatility: number;
  snapshotTime: string;
};

export type SnapshotDelta = {
  ticker: string;
  companyName: string | null;
  latest: Snapshot;
  previous: Snapshot | null;
  priceChangePercent: number;
  volumeChangePercent: number;
  peerRelativeChange: number;
  volatilityChange: number;
  /** Human-readable volatility bucket derived from the latest reading. */
  volatilityBand: "low" | "elevated" | "high";
};

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return round2(((current - previous) / Math.abs(previous)) * 100);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function volatilityBand(volatility: number): SnapshotDelta["volatilityBand"] {
  if (volatility >= 2) return "high";
  if (volatility >= 1.4) return "elevated";
  return "low";
}

/** Map a raw database row onto the engine's snapshot shape. */
export function toSnapshot(row: {
  ticker: string;
  company_name: string | null;
  price: number | string;
  volume: number | string;
  peer_relative_change: number | string;
  volatility: number | string;
  snapshot_time: string;
}): Snapshot {
  return {
    ticker: row.ticker,
    companyName: row.company_name,
    price: Number(row.price),
    volume: Number(row.volume),
    peerRelativeChange: Number(row.peer_relative_change),
    volatility: Number(row.volatility),
    snapshotTime: row.snapshot_time,
  };
}

/**
 * Group snapshot rows by ticker (newest first) and compare the newest reading
 * with the one immediately preceding it.
 */
export function buildDeltas(snapshots: Snapshot[]): SnapshotDelta[] {
  const byTicker = new Map<string, Snapshot[]>();
  for (const snap of snapshots) {
    const list = byTicker.get(snap.ticker) ?? [];
    list.push(snap);
    byTicker.set(snap.ticker, list);
  }

  const deltas: SnapshotDelta[] = [];
  for (const [ticker, list] of byTicker) {
    const ordered = [...list].sort((a, b) => +new Date(b.snapshotTime) - +new Date(a.snapshotTime));
    const latest = ordered[0];
    if (!latest) continue;
    deltas.push(compareSnapshots(ticker, latest, ordered[1] ?? null));
  }
  return deltas;
}

export function compareSnapshots(
  ticker: string,
  latest: Snapshot,
  previous: Snapshot | null,
): SnapshotDelta {
  return {
    ticker,
    companyName: latest.companyName,
    latest,
    previous,
    priceChangePercent: previous ? pctChange(latest.price, previous.price) : 0,
    volumeChangePercent: previous ? pctChange(latest.volume, previous.volume) : 0,
    peerRelativeChange: round2(latest.peerRelativeChange),
    volatilityChange: previous ? pctChange(latest.volatility, previous.volatility) : 0,
    volatilityBand: volatilityBand(latest.volatility),
  };
}
