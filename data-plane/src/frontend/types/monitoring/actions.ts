import type { EventSource } from "./events";

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
