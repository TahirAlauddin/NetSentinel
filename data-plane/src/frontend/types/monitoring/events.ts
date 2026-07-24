import type { TriggerSeverity } from "./triggers";

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
