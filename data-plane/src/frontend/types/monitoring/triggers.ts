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
