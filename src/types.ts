export interface DailyMetric {
  date: string;
  total_visits: number;
  unique_visitors: number;
  total_orders: number;
  total_revenue: number;
  total_returns: number;
  return_value: number;
  abandoned_carts: number;
  abandoned_value: number;
  conversion_rate: number;
  avg_order_value: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  current_stock: number;
  sold_count: number;
  return_count: number;
  revenue: number;
  featured: boolean;
}

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  status: string;
}

export interface RiskAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  metric_value: number;
  threshold: number;
  triggered_at: string;
  resolved: boolean;
  action_taken: string | null;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string | null;
  total: number;
  items_count: number;
  status: string;
  source: string;
  created_at: string;
  returned: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  tasks_completed: number;
  tasks_pending: number;
  orders_processed: number;
  customer_tickets_resolved: number;
  performance_score: number;
}

export interface DashboardData {
  metrics: DailyMetric[];
  products: Product[];
  campaigns: Campaign[];
  alerts: RiskAlert[];
  orders: Order[];
  team: TeamMember[];
}
