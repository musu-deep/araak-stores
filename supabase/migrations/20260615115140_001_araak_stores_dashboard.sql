-- Araak Stores E-commerce Dashboard Schema

-- Daily metrics table
CREATE TABLE daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  total_visits INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_returns INTEGER DEFAULT 0,
  return_value DECIMAL(12,2) DEFAULT 0,
  abandoned_carts INTEGER DEFAULT 0,
  abandoned_value DECIMAL(12,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  avg_order_value DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  current_stock INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  return_count INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Abandoned carts table
CREATE TABLE abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  cart_value DECIMAL(10,2) DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  abandoned_at TIMESTAMPTZ DEFAULT NOW(),
  recovered BOOLEAN DEFAULT FALSE,
  recovered_at TIMESTAMPTZ,
  recovery_campaign TEXT
);

-- Marketing campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2) DEFAULT 0,
  spent DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  tasks_completed INTEGER DEFAULT 0,
  tasks_pending INTEGER DEFAULT 0,
  orders_processed INTEGER DEFAULT 0,
  customer_tickets_resolved INTEGER DEFAULT 0,
  performance_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk alerts table
CREATE TABLE risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  metric_value DECIMAL(10,2),
  threshold DECIMAL(10,2),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  action_taken TEXT
);

-- Gap analysis table
CREATE TABLE gap_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  visits INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  conversion_cap DECIMAL(5,2) DEFAULT 5.0,
  target_orders INTEGER DEFAULT 0,
  gap_orders INTEGER DEFAULT 0,
  potential_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table for detailed tracking
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  total DECIMAL(10,2) DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  source TEXT,
  campaign_id UUID REFERENCES campaigns(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  returned BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gap_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public access for dashboard demo)
CREATE POLICY "public_read_daily_metrics" ON daily_metrics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_daily_metrics" ON daily_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_abandoned_carts" ON abandoned_carts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_abandoned_carts" ON abandoned_carts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_campaigns" ON campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_campaigns" ON campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_team_members" ON team_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_team_members" ON team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_risk_alerts" ON risk_alerts FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_risk_alerts" ON risk_alerts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_gap_analysis" ON gap_analysis FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_gap_analysis" ON gap_analysis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_orders" ON orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_orders" ON orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert sample data for daily metrics (last 30 days)
INSERT INTO daily_metrics (date, total_visits, unique_visitors, total_orders, total_revenue, total_returns, return_value, abandoned_carts, abandoned_value, conversion_rate, avg_order_value)
SELECT 
  CURRENT_DATE - i,
  FLOOR(800 + RANDOM() * 600)::INTEGER,
  FLOOR(500 + RANDOM() * 400)::INTEGER,
  FLOOR(15 + RANDOM() * 25)::INTEGER,
  FLOOR(5000 + RANDOM() * 15000)::DECIMAL(12,2),
  FLOOR(RANDOM() * 5)::INTEGER,
  FLOOR(RANDOM() * 800)::DECIMAL(12,2),
  FLOOR(30 + RANDOM() * 40)::INTEGER,
  FLOOR(3000 + RANDOM() * 5000)::DECIMAL(12,2),
  (CASE WHEN RANDOM() > 0.5 THEN FLOOR(1.5 + RANDOM() * 2.5) ELSE FLOOR(2 + RANDOM() * 2) END)::DECIMAL(5,2),
  FLOOR(250 + RANDOM() * 300)::DECIMAL(10,2)
FROM generate_series(0, 29) AS i;

-- Insert sample products
INSERT INTO products (name, sku, category, current_stock, sold_count, return_count, revenue, featured) VALUES
('جلد طبيعي ممتاز', 'SKU001', 'جلود', 45, 230, 5, 34500, true),
('صبغة شعر طبيعية', 'SKU002', 'عناية', 120, 180, 2, 18000, true),
('كريم مرطب فاخر', 'SKU003', 'عناية', 85, 310, 8, 31000, true),
('عطر رجالي مميز', 'SKU004', 'عطور', 30, 95, 3, 28500, true),
('زيت أركان أصلي', 'SKU005', 'عناية', 60, 145, 1, 14500, false),
('مرطب شفاه طبيعي', 'SKU006', 'عناية', 200, 420, 12, 16800, false),
('غسول وجه بالاعشاب', 'SKU007', 'عناية', 75, 200, 4, 12000, false),
('مجموعة العناية الكاملة', 'SKU008', 'مجموعات', 25, 85, 2, 34000, true),
('كريم مقشر طبيعي', 'SKU009', 'عناية', 90, 165, 6, 9900, false),
('سيرم مضاد للتجاعيد', 'SKU010', 'عناية', 40, 120, 3, 36000, true);

-- Insert sample campaigns
INSERT INTO campaigns (name, platform, start_date, end_date, budget, spent, impressions, clicks, conversions, revenue, status) VALUES
('حملة عيد الفطر', 'instagram', CURRENT_DATE - 20, CURRENT_DATE - 5, 5000, 4800, 150000, 8500, 120, 36000, 'completed'),
('حملة الصيف', 'snapchat', CURRENT_DATE - 10, CURRENT_DATE + 20, 8000, 5500, 220000, 12000, 180, 54000, 'active'),
('إعلانات جوجل', 'google', CURRENT_DATE - 30, CURRENT_DATE, 10000, 9200, 450000, 15000, 95, 38000, 'active'),
('حملة واتساب', 'whatsapp', CURRENT_DATE - 15, CURRENT_DATE - 1, 2000, 2000, 50000, 3200, 85, 25500, 'completed'),
('ترويج المنتجات الجديدة', 'tiktok', CURRENT_DATE - 5, CURRENT_DATE + 25, 6000, 2100, 180000, 9500, 65, 19500, 'active');

-- Insert sample team members
INSERT INTO team_members (name, role, department, tasks_completed, tasks_pending, orders_processed, customer_tickets_resolved, performance_score) VALUES
('أحمد محمد', 'مدير العمليات', 'العمليات', 145, 12, 0, 25, 4.8),
('سارة أحمد', 'خدمة العملاء', 'الدعم', 230, 8, 0, 180, 4.6),
('خالد العمري', 'تجهيز الطلبات', 'المخزن', 380, 15, 350, 0, 4.5),
('نورة السالم', 'التسويق', 'التسويق', 95, 6, 0, 12, 4.7),
('فهد الدوسري', 'التحليل', 'التقارير', 78, 4, 0, 8, 4.9),
('منى الخالد', 'خدمة العملاء', 'الدعم', 210, 10, 0, 165, 4.4),
('عبدالله الرشيد', 'التصوير والمحتوى', 'التسويق', 120, 5, 0, 0, 4.5);

-- Insert sample abandoned carts
INSERT INTO abandoned_carts (session_id, customer_email, customer_name, cart_value, items_count, abandoned_at, recovered, recovery_campaign) VALUES
('sess_001', 'user1@email.com', 'محمد أحمد', 450, 3, CURRENT_DATE - 1 + TIME '14:30:00', false, NULL),
('sess_002', 'user2@email.com', 'سارة محمد', 280, 2, CURRENT_DATE - 1 + TIME '16:45:00', true, 'حملة الاسترجاع'),
('sess_003', 'user3@email.com', 'خالد العمري', 650, 4, CURRENT_DATE - 2 + TIME '11:20:00', false, NULL),
('sess_004', NULL, NULL, 320, 2, CURRENT_DATE - 2 + TIME '19:10:00', false, NULL),
('sess_005', 'user5@email.com', 'نورة السالم', 890, 5, CURRENT_DATE - 3 + TIME '10:00:00', true, 'واتساب تذكير'),
('sess_006', 'user6@email.com', 'فهد الدوسري', 175, 1, CURRENT_DATE - 3 + TIME '15:30:00', false, NULL),
('sess_007', 'user7@email.com', 'ريم الحربي', 520, 3, CURRENT_DATE - 4 + TIME '12:45:00', false, NULL),
('sess_008', NULL, NULL, 380, 2, CURRENT_DATE - 4 + TIME '20:00:00', false, NULL);

-- Insert sample risk alerts
INSERT INTO risk_alerts (alert_type, severity, title, description, metric_value, threshold, triggered_at, resolved, action_taken) VALUES
('conversion_drop', 'high', 'انخفاض معدل التحويل', 'معدل التحويل انخفض إلى 1.8% من المتوسط 2.5%', 1.8, 2.0, CURRENT_DATE - 1, false, NULL),
('inventory_low', 'medium', 'مخزون منخفض', 'مخزون العطر الرجالي وصل إلى 30 وحدة', 30, 50, CURRENT_DATE - 2, true, 'تم طلب 100 وحدة'),
('abandoned_carts', 'high', 'ارتفاع السلال المتروكة', 'عدد السلال المتروكة تجاوز 40 يومياً', 45, 35, CURRENT_DATE - 1, false, NULL),
('return_rate', 'medium', 'ارتفاع معدل الإرجاع', 'معدل الإرجاع وصل إلى 5% من إجمالي الطلبات', 5.0, 3.0, CURRENT_DATE - 3, true, 'مراجعة جودة التغليف'),
('traffic_drop', 'low', 'انخفاض الزيارات', 'الزيارات اليومية انخفضت 15% عن المعدل', 950, 1100, CURRENT_DATE - 2, true, 'زيادة ميزانية الإعلانات');

-- Insert sample gap analysis
INSERT INTO gap_analysis (date, visits, orders, conversion_cap, target_orders, gap_orders, potential_revenue)
SELECT
  CURRENT_DATE - i,
  FLOOR(800 + RANDOM() * 600)::INTEGER,
  FLOOR(15 + RANDOM() * 25)::INTEGER,
  3.5,
  FLOOR((800 + RANDOM() * 600) * 0.035)::INTEGER,
  FLOOR((800 + RANDOM() * 600) * 0.035 - (15 + RANDOM() * 25))::INTEGER,
  FLOOR((800 + RANDOM() * 600) * 0.035 - (15 + RANDOM() * 25)) * 280::DECIMAL(12,2)
FROM generate_series(0, 13) AS i;

-- Insert sample orders for the last 7 days
INSERT INTO orders (order_id, customer_name, customer_email, total, items_count, status, source, created_at, returned)
SELECT
  'ORD-' || LPAD((i + 1)::TEXT, 6, '0'),
  CASE WHEN RANDOM() > 0.3 THEN
    (ARRAY['أحمد محمد', 'سارة أحمد', 'خالد العمري', 'نورة السالم', 'فهد الدوسري', 'منى الخالد', 'عبدالله الرشيد', 'ريم الحربي'])[FLOOR(1 + RANDOM() * 7)::INTEGER]
  ELSE NULL END,
  CASE WHEN RANDOM() > 0.3 THEN 'user' || (i + 1) || '@email.com' ELSE NULL END,
  FLOOR(150 + RANDOM() * 600)::DECIMAL(10,2),
  FLOOR(1 + RANDOM() * 4)::INTEGER,
  (ARRAY['pending', 'processing', 'shipped', 'delivered', 'delivered', 'delivered'])[FLOOR(1 + RANDOM() * 5)::INTEGER],
  (ARRAY['instagram', 'google', 'snapchat', 'direct', 'whatsapp', 'tiktok'])[FLOOR(1 + RANDOM() * 5)::INTEGER],
  CURRENT_DATE - CAST(FLOOR(RANDOM() * 7) AS INTEGER) + TIME '08:00:00' + (RANDOM() * INTERVAL '12 hours'),
  RANDOM() < 0.05
FROM generate_series(0, 80) AS i;