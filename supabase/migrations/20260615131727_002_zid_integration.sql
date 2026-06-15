-- Zid Integration Tables

-- Zid connection config (one row per store)
CREATE TABLE zid_connection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  manager_token TEXT NOT NULL,
  store_name TEXT,
  store_url TEXT,
  webhook_secret TEXT DEFAULT gen_random_uuid()::TEXT,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending',
  total_synced_orders INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw webhook events log
CREATE TABLE zid_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  zid_event_id TEXT,
  store_id TEXT,
  payload JSONB,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync operations log
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'zid',
  sync_type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- CSV/Excel upload tracking
CREATE TABLE data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT DEFAULT 'csv',
  rows_total INTEGER DEFAULT 0,
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  data_type TEXT DEFAULT 'orders',
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE zid_connection ENABLE ROW LEVEL SECURITY;
ALTER TABLE zid_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "read_zid_connection" ON zid_connection FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write_zid_connection" ON zid_connection FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "read_zid_events" ON zid_webhook_events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write_zid_events" ON zid_webhook_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "read_sync_logs" ON sync_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write_sync_logs" ON sync_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "read_data_uploads" ON data_uploads FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "write_data_uploads" ON data_uploads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Sample sync log entries
INSERT INTO sync_logs (source, sync_type, status, records_fetched, records_inserted, records_updated, started_at, completed_at) VALUES
('csv', 'orders', 'success', 320, 318, 2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 seconds'),
('zid', 'orders', 'success', 85, 82, 3, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '12 seconds'),
('zid', 'products', 'success', 48, 10, 38, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 seconds'),
('zid', 'orders', 'success', 31, 31, 0, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours' + INTERVAL '5 seconds'),
('zid', 'orders', 'running', 0, 0, 0, NOW(), NULL);

INSERT INTO data_uploads (filename, file_type, rows_total, rows_imported, rows_failed, data_type, status, uploaded_at, completed_at) VALUES
('orders_may_2025.csv', 'csv', 320, 318, 2, 'orders', 'success', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 minute'),
('products_catalog.xlsx', 'xlsx', 48, 48, 0, 'products', 'success', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 seconds');