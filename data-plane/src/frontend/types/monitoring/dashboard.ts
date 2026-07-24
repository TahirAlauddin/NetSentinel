import type { ProblemSeverity } from "./events";

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface MonitoringStats {
  hosts: {
    total: number;
    monitored: number;
    not_monitored: number;
    available: number;
    unavailable: number;
    unknown: number;
  };
  problems: {
    total_active: number;
    unacknowledged: number;
    by_severity: Record<ProblemSeverity, number>;
  };
  templates: number;
  items: number;
  triggers: {
    total: number;
    enabled: number;
    in_problem: number;
  };
  host_groups: number;
  active_maintenance: number;
}

// ─── API response helpers ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Dashboard widgets ─────────────────────────────────────────────────────────

export type DashboardChartType = "line" | "bar";

export interface DashboardWidget {
  id: number;
  name: string;
  chart_type: DashboardChartType;
  chart_type_display: string;
  zabbix_host_id: string;
  zabbix_host_name: string;
  zabbix_item_id: string;
  zabbix_item_name: string;
  zabbix_item_key: string;
  refresh_interval: number;
  refresh_interval_display: string;
  time_period_hours: number;
  time_period_display: string;
  show_header: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardWidgetFormData {
  name: string;
  chart_type: DashboardChartType;
  zabbix_host_id: string;
  zabbix_host_name?: string;
  zabbix_item_id: string;
  zabbix_item_name?: string;
  zabbix_item_key?: string;
  refresh_interval: number;
  time_period_hours: number;
  show_header?: boolean;
}

export interface MonitoringLookupHost {
  id: number;
  name: string;
  technical_name: string;
}

export interface MonitoringLookupItem {
  id: number;
  name: string;
  key: string;
  value_type: number;
  units: string;
  graphable: boolean;
}

export interface GraphDataPoint {
  timestamp: number;
  time: string;
  value: number;
}

export interface GraphDataResponse {
  item_id: string;
  item_name: string;
  item_key: string;
  units: string;
  host_name: string | null;
  points: GraphDataPoint[];
}
