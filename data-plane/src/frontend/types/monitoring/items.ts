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
