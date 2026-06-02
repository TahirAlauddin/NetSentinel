// ─── Host Groups ─────────────────────────────────────────────────────────────

export interface HostGroup {
  id: number;
  name: string;
  description: string;
  host_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostGroupFormData {
  name: string;
  description?: string;
}

// ─── Proxies ──────────────────────────────────────────────────────────────────

export type ProxyMode = "active" | "passive";
export type ProxyStatus = "enabled" | "disabled";

export interface Proxy {
  id: number;
  name: string;
  mode: ProxyMode;
  mode_display: string;
  address: string;
  port: number;
  description: string;
  status: ProxyStatus;
  status_display: string;
  tls_connect: string;
  tls_accept: string;
  created_at: string;
  updated_at: string;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export interface TemplateTag {
  id: number;
  tag: string;
  value: string;
}

export interface Template {
  id: number;
  name: string;
  description: string;
  host_groups: number[];
  host_groups_detail: HostGroup[];
  linked_templates: number[];
  linked_templates_detail: { id: number; name: string }[];
  tags: TemplateTag[];
  item_count: number;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateFormData {
  name: string;
  description?: string;
  host_groups?: number[];
  linked_templates?: number[];
}

// ─── Hosts ────────────────────────────────────────────────────────────────────

export type HostStatus = "monitored" | "unmonitored";
export type HostAvailability = "unknown" | "available" | "unavailable";
export type HostInventoryMode = "disabled" | "manual" | "automatic";
export type SnmpVersion = "v1" | "v2c" | "v3";

export interface HostTag {
  id: number;
  tag: string;
  value: string;
}

export interface Host {
  id: number;
  name: string;
  visible_name: string;
  description: string;
  ip_address: string | null;
  dns_name: string;
  use_dns: boolean;
  port: number;
  status: HostStatus;
  status_display: string;
  inventory_mode: HostInventoryMode;
  availability: HostAvailability;
  availability_display: string;
  host_groups: number[];
  host_groups_detail: HostGroup[];
  templates: number[];
  templates_detail: { id: number; name: string }[];
  proxy: number | null;
  proxy_detail: Proxy | null;
  tags: HostTag[];
  snmp_version: SnmpVersion | "";
  snmp_community: string;
  snmp_port: number;
  snmp_bulk: boolean;
  jmx_port: number;
  ipmi_authtype: string;
  ipmi_privilege: string;
  ipmi_username: string;
  ipmi_password: string;
  tls_connect: string;
  tls_accept: string;
  location: string;
  os: string;
  hardware: string;
  software: string;
  asset_tag: string;
  serial_number: string;
  model: string;
  vendor: string;
  display_address: string;
  problem_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostFormData {
  name: string;
  visible_name?: string;
  description?: string;
  ip_address?: string;
  dns_name?: string;
  use_dns?: boolean;
  port?: number;
  status?: HostStatus;
  inventory_mode?: HostInventoryMode;
  host_groups?: number[];
  templates?: number[];
  proxy?: number | null;
  snmp_version?: SnmpVersion | "";
  snmp_community?: string;
  snmp_port?: number;
  snmp_bulk?: boolean;
  location?: string;
  os?: string;
  hardware?: string;
  software?: string;
  asset_tag?: string;
  serial_number?: string;
  model?: string;
  vendor?: string;
}

// ─── Items ────────────────────────────────────────────────────────────────────

export type ItemType =
  | "zabbix_agent"
  | "zabbix_agent_active"
  | "snmp_v1"
  | "snmp_v2c"
  | "snmp_v3"
  | "snmp_trap"
  | "internal"
  | "external"
  | "database_monitor"
  | "http_agent"
  | "ipmi"
  | "ssh"
  | "telnet"
  | "jmx"
  | "calculated"
  | "trapper"
  | "aggregate"
  | "dependent";

export type ValueType = "float" | "character" | "log" | "unsigned_int" | "text";
export type ItemStatus = "enabled" | "disabled";

export interface Item {
  id: number;
  host: number | null;
  host_name: string | null;
  template: number | null;
  template_name: string | null;
  name: string;
  key: string;
  item_type: ItemType;
  item_type_display: string;
  value_type: ValueType;
  value_type_display: string;
  units: string;
  delay: string;
  history: string;
  trends: string;
  status: ItemStatus;
  status_display: string;
  description: string;
  snmp_oid: string;
  url: string;
  http_method: string;
  request_body: string;
  status_codes: string;
  timeout: string;
  params: string;
  allowed_hosts: string;
  value_map: string;
  created_at: string;
  updated_at: string;
}

export interface ItemFormData {
  host?: number;
  template?: number;
  name: string;
  key: string;
  item_type?: ItemType;
  value_type?: ValueType;
  units?: string;
  delay?: string;
  history?: string;
  trends?: string;
  status?: ItemStatus;
  description?: string;
  snmp_oid?: string;
  url?: string;
  http_method?: string;
  params?: string;
}

// ─── Triggers ─────────────────────────────────────────────────────────────────

export type TriggerSeverity =
  | "not_classified"
  | "information"
  | "warning"
  | "average"
  | "high"
  | "disaster";

export type TriggerStatus = "enabled" | "disabled";
export type TriggerState = "normal" | "problem" | "unknown";

export interface Trigger {
  id: number;
  host: number | null;
  host_name: string | null;
  template: number | null;
  template_name: string | null;
  name: string;
  expression: string;
  recovery_expression: string;
  recovery_mode: string;
  correlation_mode: string;
  correlation_tag: string;
  severity: TriggerSeverity;
  severity_display: string;
  severity_color: string;
  status: TriggerStatus;
  status_display: string;
  state: TriggerState;
  state_display: string;
  description: string;
  url: string;
  comments: string;
  manual_close: boolean;
  generate_multiple_events: boolean;
  created_at: string;
  updated_at: string;
}

export interface TriggerFormData {
  host?: number;
  template?: number;
  name: string;
  expression: string;
  recovery_expression?: string;
  severity?: TriggerSeverity;
  status?: TriggerStatus;
  description?: string;
  url?: string;
  comments?: string;
  manual_close?: boolean;
}

// ─── Problems ─────────────────────────────────────────────────────────────────

export type ProblemStatus = "active" | "resolved";
export type ProblemSeverity = TriggerSeverity;

export interface Problem {
  id: number;
  host: number | null;
  host_name: string | null;
  trigger: number | null;
  trigger_name: string | null;
  name: string;
  severity: ProblemSeverity;
  severity_display: string;
  status: ProblemStatus;
  status_display: string;
  clock: string;
  r_clock: string | null;
  acknowledged: boolean;
  ack_message: string;
  ack_time: string | null;
  suppressed: boolean;
  tags: Array<{ tag: string; value: string }>;
  is_manual: boolean;
  note: string;
  duration: string;
  created_at: string;
  updated_at: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type EventSource = "trigger" | "discovery" | "autoregistration" | "internal" | "service";
export type EventValue = "problem" | "ok" | "unknown";

export interface Event {
  id: number;
  host: number | null;
  host_name: string | null;
  trigger: number | null;
  trigger_name: string | null;
  problem: number | null;
  source: EventSource;
  source_display: string;
  value: EventValue;
  value_display: string;
  name: string;
  severity: TriggerSeverity;
  severity_display: string;
  clock: string;
  acknowledged: boolean;
  r_eventid: number | null;
  action_results: unknown[];
}


// ─── Actions ──────────────────────────────────────────────────────────────────

export type ActionEventSource = EventSource;
export type ActionStatus = "enabled" | "disabled";

export interface ActionCondition {
  id: number;
  condition_type: string;
  operator: string;
  value: string;
  value2: string;
  formula_id: string;
  trigger_source?: string;
  trigger_ids?: number[];
  triggers_detail?: Array<{ id: number; name: string }>;
}

export interface ActionOperation {
  id: number;
  operation_type: string;
  op_step_from: number;
  op_step_to: number;
  op_step_duration: number;
  default_msg: boolean;
  message_subject: string;
  message_body: string;
  media_type: number | null;
  media_type_detail: { id: number; name: string } | null;
  command_type: string;
  command: string;
  execute_on: string;
  run_script_on_zabbix_agent: boolean;
}

export interface Action {
  id: number;
  name: string;
  eventsource: ActionEventSource;
  eventsource_display: string;
  status: ActionStatus;
  status_display: string;
  eval_type: string;
  formula: string;
  esc_period?: string;
  pause_suppressed: boolean;
  pause_symptoms?: boolean;
  notify_if_canceled: boolean;
  conditions: ActionCondition[];
  operations: ActionOperation[];
  recovery_operations?: ActionOperation[];
  update_operations?: ActionOperation[];
  condition_count: number;
  operation_count: number;
  created_at: string;
  updated_at: string;
}

/** Local form row ids (client-only until saved). */
export type ActionConditionTriggerSource = "host" | "template";

export interface ActionFormConditionDraft {
  key: string;
  condition_type: string;
  operator: string;
  trigger_source: ActionConditionTriggerSource;
  host_id: number | null;
  trigger_id: number | null;
  value: string;
  value2: string;
  formula_id: string;
}

export interface ActionFormOperationDraft {
  key: string;
  operation_type: string;
  op_step_from: number;
  op_step_to: number;
  op_step_duration: string;
  default_msg: boolean;
  message_subject: string;
  message_body: string;
  media_type: string;
  command_type: string;
  command: string;
  execute_on: string;
}

export interface ActionFormValues {
  name: string;
  eventsource: ActionEventSource;
  status: ActionStatus;
  eval_type: string;
  formula: string;
  esc_period: string;
  pause_suppressed: boolean;
  pause_symptoms: boolean;
  notify_if_canceled: boolean;
  conditions: ActionFormConditionDraft[];
  operations: ActionFormOperationDraft[];
  recovery_operations: ActionFormOperationDraft[];
  update_operations: ActionFormOperationDraft[];
}


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
