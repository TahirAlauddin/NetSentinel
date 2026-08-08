import type { HostGroup, Proxy } from "./core";

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
