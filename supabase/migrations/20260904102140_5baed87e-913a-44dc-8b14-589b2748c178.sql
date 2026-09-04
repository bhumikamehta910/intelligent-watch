CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX watchlists_user_id_idx ON public.watchlists(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlists TO authenticated;
GRANT ALL ON public.watchlists TO service_role;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own watchlists" ON public.watchlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (watchlist_id, ticker)
);
CREATE INDEX watchlist_items_watchlist_id_idx ON public.watchlist_items(watchlist_id);
CREATE INDEX watchlist_items_ticker_idx ON public.watchlist_items(ticker);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist_items TO authenticated;
GRANT ALL ON public.watchlist_items TO service_role;
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own watchlist items" ON public.watchlist_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.watchlists w WHERE w.id = watchlist_id AND w.user_id = auth.uid()));

CREATE TABLE public.market_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker TEXT NOT NULL,
  company_name TEXT,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'news',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  impact SMALLINT NOT NULL DEFAULT 50,
  price_change_pct NUMERIC(6,2),
  source TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX market_events_ticker_time_idx ON public.market_events(ticker, occurred_at DESC);
GRANT SELECT ON public.market_events TO authenticated;
GRANT ALL ON public.market_events TO service_role;
ALTER TABLE public.market_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signed in can read events" ON public.market_events FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.market_events (ticker, company_name, headline, summary, category, sentiment, impact, price_change_pct, source, occurred_at) VALUES
('AAPL','Apple Inc.','Apple lifts services guidance after record App Store quarter','Services revenue grew 14% YoY, the fastest in eight quarters. Management raised full-year services growth guidance, which matters because services carry ~2x hardware gross margin.','earnings','positive',88,2.41,'Q3 Earnings Call', now() - interval '3 hours'),
('AAPL','Apple Inc.','Supplier checks point to softer iPhone builds in Asia','Two assembly partners trimmed build plans ~5%. Historically a leading indicator for unit revenue, though mix shift to Pro models has offset similar cuts before.','supply-chain','negative',61,-0.82,'Supply Chain Note', now() - interval '2 days'),
('NVDA','NVIDIA Corporation','Data center backlog extends into next fiscal year','Booked capacity is now sold out through the next four quarters. The constraint has shifted from demand to advanced packaging supply.','guidance','positive',94,4.12,'Analyst Day', now() - interval '9 hours'),
('NVDA','NVIDIA Corporation','New export rules narrow the addressable China market','Updated licensing thresholds capture a mid-tier accelerator that previously shipped freely. China was roughly a fifth of data center revenue.','regulatory','negative',77,-3.05,'Regulatory Filing', now() - interval '4 days'),
('MSFT','Microsoft Corporation','Azure growth reaccelerates on AI workloads','Azure grew 31% in constant currency, ahead of the 28% guide. AI services contributed ~8 points, showing the capex cycle is converting into revenue.','earnings','positive',85,1.87,'Q2 Results', now() - interval '1 day'),
('MSFT','Microsoft Corporation','Capex step-up pressures near-term free cash flow','Quarterly capex rose to a record as datacenter buildout accelerates. Free cash flow conversion fell sequentially even as margins held.','financials','neutral',58,-0.34,'10-Q', now() - interval '6 days'),
('TSLA','Tesla, Inc.','Energy storage deployments hit an all-time high','Storage gross margin now exceeds automotive for the second consecutive quarter, changing the shape of the earnings mix.','earnings','positive',79,3.64,'Shareholder Deck', now() - interval '15 hours'),
('TSLA','Tesla, Inc.','Price cuts across two core markets','Entry trims were reduced again to defend share. Each 1% ASP cut is roughly 30bps of automotive gross margin at current volumes.','pricing','negative',72,-2.18,'Company Website', now() - interval '3 days'),
('AMZN','Amazon.com, Inc.','Advertising revenue outpaces retail again','Ads grew 22% and now represent the highest-margin growth engine outside AWS.','earnings','positive',74,1.22,'Q4 Results', now() - interval '20 hours'),
('GOOGL','Alphabet Inc.','Search share stable despite assistant competition','Query volume grew year over year, countering the thesis that AI assistants are structurally displacing search monetization.','market','positive',68,0.94,'Earnings Call', now() - interval '2 days'),
('GOOGL','Alphabet Inc.','Antitrust remedy hearing scheduled','The remedies phase will determine whether default placement agreements survive. Those agreements underpin a meaningful share of query volume.','regulatory','negative',81,-1.44,'Court Docket', now() - interval '5 days'),
('META','Meta Platforms, Inc.','Reality Labs losses narrow for the first time','Operating loss shrank sequentially on lower hardware costs, easing the biggest drag on consolidated margin.','financials','positive',66,1.03,'Q3 Results', now() - interval '1 day'),
('AMD','Advanced Micro Devices, Inc.','Accelerator roadmap pulled forward two quarters','The next-generation part moves into sampling early, compressing the competitive gap in inference workloads.','product','positive',71,2.77,'Product Briefing', now() - interval '11 hours'),
('JPM','JPMorgan Chase & Co.','Net interest income guidance raised','Deposit costs stabilized faster than modeled, lifting full-year NII guidance despite expected rate cuts.','guidance','positive',69,1.11,'Investor Day', now() - interval '2 days'),
('NFLX','Netflix, Inc.','Ad tier reaches scale threshold','The ad-supported plan crossed the subscriber level where CPM pricing power typically improves.','market','positive',64,1.58,'Letter to Shareholders', now() - interval '4 days');