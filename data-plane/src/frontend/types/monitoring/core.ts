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

// ─── Template Groups ──────────────────────────────────────────────────────────

export interface TemplateGroup {
  id: number;
  name: string;
  description: string;
  template_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateGroupFormData {
  name: string;
  description?: string;
}
