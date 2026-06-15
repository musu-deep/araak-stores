-- ARAAK Stores Governance Layer
-- Users, Permissions, Admin Portal, Layout Governance

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) User Profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending', -- pending, active, blocked
  department TEXT,
  job_title TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Permissions Catalog
CREATE TABLE IF NOT EXISTS permissions (
  key TEXT PRIMARY KEY,
  label_ar TEXT NOT NULL,
  label_en TEXT,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_key TEXT REFERENCES permissions(key) ON DELETE CASCADE,
  allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, permission_key)
);

-- 4) User Permission Overrides
CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key TEXT REFERENCES permissions(key) ON DELETE CASCADE,
  effect TEXT NOT NULL CHECK (effect IN ('allow', 'deny')),
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_key)
);

-- 5) Page Components Catalog
CREATE TABLE IF NOT EXISTS page_components (
  key TEXT PRIMARY KEY,
  page_key TEXT NOT NULL,
  label_ar TEXT NOT NULL,
  label_en TEXT,
  component_type TEXT DEFAULT 'widget',
  default_visible BOOLEAN DEFAULT TRUE,
  default_order INTEGER DEFAULT 100,
  sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6) Role Component Access
CREATE TABLE IF NOT EXISTS role_component_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  component_key TEXT REFERENCES page_components(key) ON DELETE CASCADE,
  visible BOOLEAN DEFAULT TRUE,
  locked BOOLEAN DEFAULT FALSE,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, component_key)
);

-- 7) User Component Overrides
CREATE TABLE IF NOT EXISTS user_component_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  component_key TEXT REFERENCES page_components(key) ON DELETE CASCADE,
  visible BOOLEAN,
  sort_order INTEGER,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, component_key)
);

-- 8) Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  entity_type TEXT,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Permissions
INSERT INTO permissions (key, label_ar, label_en, category, description) VALUES
('view_dashboard', 'عرض لوحة القيادة', 'View Dashboard', 'general', 'Can view command deck'),
('run_agents', 'تشغيل الوكلاء', 'Run Agents', 'agents', 'Can run AI agents'),
('view_finance', 'عرض المالية', 'View Finance', 'finance', 'Can view finance data'),
('view_customers', 'عرض العملاء', 'View Customers', 'customers', 'Can view customers intelligence'),
('view_procurement', 'عرض الموردين', 'View Procurement', 'procurement', 'Can view procurement data'),
('view_reports', 'عرض التقارير', 'View Reports', 'reports', 'Can view reports'),
('sync_zid', 'مزامنة زد', 'Sync Zid', 'zid', 'Can run Zid sync'),
('manage_users', 'إدارة المستخدمين', 'Manage Users', 'admin', 'Can approve/block/delete users'),
('manage_permissions', 'إدارة الصلاحيات', 'Manage Permissions', 'admin', 'Can manage role and user permissions'),
('manage_layout', 'إدارة واجهة البورتال', 'Manage Layout', 'admin', 'Can show/hide page components'),
('export_reports', 'تصدير التقارير', 'Export Reports', 'reports', 'Can export reports'),
('delete_records', 'حذف السجلات', 'Delete Records', 'admin', 'Can delete records')
ON CONFLICT (key) DO NOTHING;

-- Seed Role Permissions
INSERT INTO role_permissions (role, permission_key, allowed)
SELECT 'admin', key, TRUE FROM permissions
ON CONFLICT (role, permission_key) DO NOTHING;

INSERT INTO role_permissions (role, permission_key, allowed) VALUES
('ceo', 'view_dashboard', TRUE),
('ceo', 'run_agents', TRUE),
('ceo', 'view_finance', TRUE),
('ceo', 'view_customers', TRUE),
('ceo', 'view_procurement', TRUE),
('ceo', 'view_reports', TRUE),
('ceo', 'sync_zid', TRUE),
('ceo', 'export_reports', TRUE),

('manager', 'view_dashboard', TRUE),
('manager', 'run_agents', TRUE),
('manager', 'view_customers', TRUE),
('manager', 'view_reports', TRUE),

('analyst', 'view_dashboard', TRUE),
('analyst', 'view_reports', TRUE),

('viewer', 'view_dashboard', TRUE)
ON CONFLICT (role, permission_key) DO NOTHING;

-- Seed Page Components
INSERT INTO page_components (key, page_key, label_ar, label_en, component_type, default_visible, default_order, sensitive) VALUES
('command.kpi_bar', 'command', 'مؤشرات الأداء الرئيسية', 'KPI Bar', 'widget', TRUE, 10, FALSE),
('command.shipping_panel', 'command', 'أداء شركات الشحن', 'Shipping Panel', 'widget', TRUE, 20, FALSE),
('command.globe', 'command', 'مركز العمليات العالمي', 'Globe Operations', 'widget', TRUE, 30, FALSE),
('command.ai_recommendations', 'command', 'التنبيهات الذكية', 'AI Recommendations', 'widget', TRUE, 40, FALSE),
('command.quick_actions', 'command', 'الأوامر السريعة', 'Quick Actions', 'widget', TRUE, 50, FALSE),
('command.agents_dock', 'command', 'هيئة الوكلاء التنفيذيين', 'Agents Dock', 'widget', TRUE, 60, FALSE),
('command.right_panel', 'command', 'اللوحة الجانبية', 'Right Panel', 'widget', TRUE, 70, FALSE),
('command.ticker', 'command', 'شريط الأخبار', 'Ticker', 'widget', TRUE, 80, FALSE),

('finance.cards', 'finance', 'بطاقات المالية', 'Finance Cards', 'widget', TRUE, 10, TRUE),
('customers.insights', 'customers', 'تحليلات العملاء', 'Customer Insights', 'widget', TRUE, 10, TRUE),
('procurement.insights', 'procurement', 'تحليلات الموردين', 'Procurement Insights', 'widget', TRUE, 10, TRUE),
('zid.sync_button', 'zid', 'زر مزامنة زد', 'Zid Sync Button', 'button', TRUE, 10, TRUE),
('admin.user_management', 'admin', 'إدارة المستخدمين', 'User Management', 'admin', TRUE, 10, TRUE),
('admin.layout_management', 'admin', 'إدارة واجهة البورتال', 'Layout Management', 'admin', TRUE, 20, TRUE)
ON CONFLICT (key) DO NOTHING;

-- Admin sees everything
INSERT INTO role_component_access (role, component_key, visible, locked, sort_order)
SELECT 'admin', key, TRUE, FALSE, default_order FROM page_components
ON CONFLICT (role, component_key) DO NOTHING;

-- CEO sees everything except admin management by default
INSERT INTO role_component_access (role, component_key, visible, locked, sort_order)
SELECT 'ceo', key, CASE WHEN page_key = 'admin' THEN FALSE ELSE TRUE END, FALSE, default_order
FROM page_components
ON CONFLICT (role, component_key) DO NOTHING;

-- Manager limited
INSERT INTO role_component_access (role, component_key, visible, locked, sort_order)
SELECT 'manager', key,
CASE WHEN sensitive = TRUE AND page_key IN ('finance','admin','zid') THEN FALSE ELSE TRUE END,
FALSE,
default_order
FROM page_components
ON CONFLICT (role, component_key) DO NOTHING;

-- Viewer dashboard only
INSERT INTO role_component_access (role, component_key, visible, locked, sort_order)
SELECT 'viewer', key,
CASE WHEN page_key = 'command' THEN TRUE ELSE FALSE END,
FALSE,
default_order
FROM page_components
ON CONFLICT (role, component_key) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_overrides_user_id ON user_permission_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_component_overrides_user_id ON user_component_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
