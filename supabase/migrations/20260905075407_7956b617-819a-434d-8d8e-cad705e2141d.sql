CREATE TABLE public.stock_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL,
  company_name text,
  price numeric NOT NULL,
  volume bigint NOT NULL,
  peer_relative_change numeric NOT NULL DEFAULT 0,
  volatility numeric NOT NULL DEFAULT 0,
  snapshot_time timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX stock_snapshots_ticker_time_idx ON public.stock_snapshots (ticker, snapshot_time DESC);

GRANT SELECT ON public.stock_snapshots TO anon;
GRANT SELECT ON public.stock_snapshots TO authenticated;
GRANT ALL ON public.stock_snapshots TO service_role;

ALTER TABLE public.stock_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots are publicly readable"
  ON public.stock_snapshots FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.attention_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker text NOT NULL UNIQUE,
  score smallint NOT NULL,
  classification text NOT NULL,
  explanation jsonb NOT NULL DEFAULT '[]'::jsonb,
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  verdict text,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX attention_scores_score_idx ON public.attention_scores (score DESC);

GRANT SELECT ON public.attention_scores TO anon;
GRANT SELECT ON public.attention_scores TO authenticated;
GRANT ALL ON public.attention_scores TO service_role;

ALTER TABLE public.attention_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attention scores are publicly readable"
  ON public.attention_scores FOR SELECT TO anon, authenticated USING (true);

-- Seed two readings per demo company so the engine always has a previous vs latest pair.
INSERT INTO public.stock_snapshots (ticker, company_name, price, volume, peer_relative_change, volatility, snapshot_time) VALUES
  ('TCS','Tata Consultancy Services',3821.50,4200000,0.60,1.10, now() - interval '2 days'),
  ('TCS','Tata Consultancy Services',4128.60,13440000,5.40,1.85, now() - interval '3 hours'),
  ('INFY','Infosys',1844.80,6100000,0.30,1.20, now() - interval '2 days'),
  ('INFY','Infosys',1902.35,11956000,1.10,2.30, now() - interval '6 hours'),
  ('RELIANCE','Reliance Industries',3059.10,7800000,0.20,1.05, now() - interval '2 days'),
  ('RELIANCE','Reliance Industries',2985.10,12558000,-3.30,1.60, now() - interval '11 hours'),
  ('HDFCBANK','HDFC Bank',1690.80,5400000,0.10,0.80, now() - interval '2 days'),
  ('HDFCBANK','HDFC Bank',1712.45,6372000,0.40,0.86, now() - interval '31 hours'),
  ('ICICIBANK','ICICI Bank',1252.55,4900000,-0.20,0.90, now() - interval '2 days'),
  ('ICICIBANK','ICICI Bank',1244.80,6566000,-1.20,1.00, now() - interval '19 hours');