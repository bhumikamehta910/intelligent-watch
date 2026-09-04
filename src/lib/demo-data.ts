/**
 * Static demo dataset for the no-login "Explore Demo" workspace.
 * Nothing here touches the database — it is deterministic sample content
 * so a first-time visitor can understand PulseIQ in under a minute.
 */

const HOUR = 3600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();

export type DemoSnapshot = {
  ticker: string;
  companyName: string;
  price: number;
  changePct: number;
  volumeChangePct: number;
  peerRelativePct: number;
  volatility: "low" | "elevated" | "high";
};

export type DemoAttention = {
  ticker: string;
  score: number;
  verdict: string;
  reasons: string[];
};

export type DemoActivity = {
  id: string;
  ticker: string;
  occurredAt: string;
  category: string;
  sentiment: "positive" | "negative" | "neutral";
  headline: string;
  summary: string;
  priceChangePct: number | null;
  impact: number;
  source: string;
};

export const DEMO_WATCHLIST = {
  name: "Indian Large Cap",
  /** Simulated "last visit" marker for the Since You Were Away section. */
  lastSeenAt: ago(26),
};

export const DEMO_SNAPSHOTS: DemoSnapshot[] = [
  {
    ticker: "TCS",
    companyName: "Tata Consultancy Services",
    price: 4128.6,
    changePct: 8.04,
    volumeChangePct: 220,
    peerRelativePct: 5.4,
    volatility: "elevated",
  },
  {
    ticker: "INFY",
    companyName: "Infosys",
    price: 1902.35,
    changePct: 3.12,
    volumeChangePct: 96,
    peerRelativePct: 1.1,
    volatility: "high",
  },
  {
    ticker: "RELIANCE",
    companyName: "Reliance Industries",
    price: 2985.1,
    changePct: -2.42,
    volumeChangePct: 61,
    peerRelativePct: -3.3,
    volatility: "elevated",
  },
  {
    ticker: "HDFCBANK",
    companyName: "HDFC Bank",
    price: 1712.45,
    changePct: 1.28,
    volumeChangePct: 18,
    peerRelativePct: 0.4,
    volatility: "low",
  },
  {
    ticker: "ICICIBANK",
    companyName: "ICICI Bank",
    price: 1244.8,
    changePct: -0.62,
    volumeChangePct: 34,
    peerRelativePct: -1.2,
    volatility: "low",
  },
];

export const DEMO_ATTENTION: DemoAttention[] = [
  {
    ticker: "TCS",
    score: 91,
    verdict: "Unusual buying, not just a drift — worth a look today.",
    reasons: ["Price increased 8%", "Volume increased 220%", "Outperforming peers"],
  },
  {
    ticker: "INFY",
    score: 78,
    verdict: "Riding the IT sector bid, but the swings are widening.",
    reasons: ["Sector momentum detected", "Increased volatility"],
  },
  {
    ticker: "RELIANCE",
    score: 64,
    verdict: "Weak against its own sector after a downgrade.",
    reasons: ["Price fell 2.4%", "Broker downgrade", "Underperforming peers"],
  },
  {
    ticker: "ICICIBANK",
    score: 41,
    verdict: "Quiet drift with the banking index. Nothing company-specific.",
    reasons: ["Moving with the banking index", "No company-specific news"],
  },
  {
    ticker: "HDFCBANK",
    score: 28,
    verdict: "Stable. No action needed.",
    reasons: ["Low volatility", "Volume in normal range"],
  },
];

export const DEMO_ACTIVITY: DemoActivity[] = [
  {
    id: "a1",
    ticker: "TCS",
    occurredAt: ago(3),
    category: "momentum",
    sentiment: "positive",
    headline: "TCS jumps 8% on a large multi-year deal win",
    summary:
      "A $2.1B managed-services contract with a European bank was confirmed before market open. Volume ran 3.2x its 30-day average, and the move held into the close instead of fading — a sign institutions were buying, not day traders.",
    priceChangePct: 8.04,
    impact: 91,
    source: "Exchange filing",
  },
  {
    id: "a2",
    ticker: "INFY",
    occurredAt: ago(6),
    category: "sector",
    sentiment: "positive",
    headline: "Infosys pulled higher as IT sector momentum builds",
    summary:
      "Infosys added 3.1% without company-specific news. The whole IT index moved on the back of the TCS deal, so this is sector spillover. Intraday swings widened to roughly twice the usual range.",
    priceChangePct: 3.12,
    impact: 78,
    source: "PulseIQ signal",
  },
  {
    id: "a3",
    ticker: "RELIANCE",
    occurredAt: ago(11),
    category: "analyst",
    sentiment: "negative",
    headline: "Reliance downgraded on refining margin pressure",
    summary:
      "Two brokerages cut Reliance to hold, citing thinner refining spreads for the coming quarter. The stock lagged the energy index by 3.3%, so the weakness is company-specific rather than market-wide.",
    priceChangePct: -2.42,
    impact: 72,
    source: "Analyst note",
  },
  {
    id: "a4",
    ticker: "ICICIBANK",
    occurredAt: ago(19),
    category: "news",
    sentiment: "neutral",
    headline: "ICICI Bank drifts with the banking index",
    summary:
      "A 0.6% decline that mirrors the banking index almost exactly. No filing, no guidance change, and volume only 34% above normal — this is index movement, not a company story.",
    priceChangePct: -0.62,
    impact: 41,
    source: "PulseIQ signal",
  },
  {
    id: "a5",
    ticker: "HDFCBANK",
    occurredAt: ago(31),
    category: "earnings",
    sentiment: "positive",
    headline: "HDFC Bank posts steady deposit growth",
    summary:
      "Quarterly deposits grew 4% sequentially, in line with expectations. The market reaction was muted at +1.3% with normal volume — confirmation of the existing story rather than new information.",
    priceChangePct: 1.28,
    impact: 38,
    source: "Quarterly update",
  },
  {
    id: "a6",
    ticker: "TCS",
    occurredAt: ago(44),
    category: "news",
    sentiment: "neutral",
    headline: "TCS scheduled a board meeting for the deal announcement",
    summary:
      "The filing that preceded yesterday's move. On its own it looked routine; in hindsight it was the first marker of the contract that repriced the stock.",
    priceChangePct: 0.35,
    impact: 30,
    source: "Exchange filing",
  },
  {
    id: "a7",
    ticker: "RELIANCE",
    occurredAt: ago(58),
    category: "news",
    sentiment: "neutral",
    headline: "Reliance retail arm opened 40 new stores",
    summary:
      "An expansion update with little price effect. Included so the timeline shows the full context leading into the downgrade two days later.",
    priceChangePct: 0.18,
    impact: 22,
    source: "Company release",
  },
];

export const DEMO_TICKERS = DEMO_SNAPSHOTS.map((s) => s.ticker);

export function demoCompany(ticker: string) {
  return DEMO_SNAPSHOTS.find((s) => s.ticker === ticker);
}

export function demoAttentionFor(ticker: string) {
  return DEMO_ATTENTION.find((a) => a.ticker === ticker);
}

/** Activity newest-first. */
export const DEMO_ACTIVITY_DESC = [...DEMO_ACTIVITY].sort(
  (a, b) => +new Date(b.occurredAt) - +new Date(a.occurredAt),
);

export const DEMO_SINCE_AWAY = DEMO_ACTIVITY_DESC.filter(
  (e) => +new Date(e.occurredAt) > +new Date(DEMO_WATCHLIST.lastSeenAt),
);
