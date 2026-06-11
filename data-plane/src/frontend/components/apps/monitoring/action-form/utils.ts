import type {
  Action,
  ActionFormConditionDraft,
  ActionFormOperationDraft,
  ActionFormValues,
  Trigger,
} from "@/types/monitoring";

// ─── Key helpers ──────────────────────────────────────────────────────────────

export function newKey() {
  return `k-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Empty drafts ─────────────────────────────────────────────────────────────

export function emptyCondition(): ActionFormConditionDraft {
  return {
    key: newKey(),
    condition_type: "trigger",
    operator: "equals",
    trigger_source: "host",
    host_id: null,
    trigger_id: null,
    value: "",
    value2: "",
    formula_id: "A",
  };
}

export function emptyOperation(): ActionFormOperationDraft {
  return {
    key: newKey(),
    operation_type: "send_message",
    op_step_from: 1,
    op_step_to: 1,
    op_step_duration: "0",
    default_msg: true,
    message_subject: "",
    message_body: "",
    media_type: "",
    command_type: "custom_script",
    command: "",
    execute_on: "server",
  };
}

export function defaultActionFormValues(): ActionFormValues {
  return {
    name: "",
    eventsource: "trigger",
    status: "enabled",
    eval_type: "and",
    formula: "",
    esc_period: "3600",
    pause_suppressed: true,
    pause_symptoms: true,
    notify_if_canceled: true,
    conditions: [],
    operations: [],
    recovery_operations: [],
    update_operations: [],
  };
}

// ─── API → form mappers ───────────────────────────────────────────────────────

function parseTriggerIds(value: string, triggerIds?: number[]): number[] {
  if (triggerIds?.length) return triggerIds;
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
}

export function conditionFromApi(
  c: Action["conditions"][number]
): ActionFormConditionDraft {
  const raw =
    (c.trigger_source as ActionFormConditionDraft["trigger_source"]) ||
    (c.value2 as ActionFormConditionDraft["trigger_source"]) ||
    "host";
  const triggerSource: ActionFormConditionDraft["trigger_source"] =
    raw === "template" ? "template" : "host";

  const parsedIds = parseTriggerIds(c.value, c.trigger_ids);

  return {
    key: newKey(),
    condition_type: c.condition_type,
    operator: c.operator,
    trigger_source: triggerSource,
    host_id: null,
    trigger_id: parsedIds[0] ?? null,
    value: c.condition_type === "trigger" ? "" : c.value,
    value2: c.value2 ?? "",
    formula_id: c.formula_id || "A",
  };
}

export function operationFromApi(
  op: Action["operations"][number]
): ActionFormOperationDraft {
  return {
    key: newKey(),
    operation_type: op.operation_type || "send_message",
    op_step_from: op.op_step_from ?? 1,
    op_step_to: op.op_step_to ?? 1,
    op_step_duration: String(op.op_step_duration ?? 0),
    default_msg: op.default_msg ?? true,
    message_subject: op.message_subject ?? "",
    message_body: op.message_body ?? "",
    media_type: op.media_type_detail?.name ?? "",
    command_type: op.command_type || "custom_script",
    command: op.command ?? "",
    execute_on: op.execute_on || "server",
  };
}

export function actionToFormValues(action: Action): ActionFormValues {
  return {
    name: action.name,
    eventsource: action.eventsource,
    status: action.status,
    eval_type: action.eval_type || "and",
    formula: action.formula || "",
    esc_period: action.esc_period || "3600",
    pause_suppressed: action.pause_suppressed ?? true,
    pause_symptoms: action.pause_symptoms ?? true,
    notify_if_canceled: action.notify_if_canceled ?? true,
    conditions: (action.conditions ?? []).map(conditionFromApi),
    operations: (action.operations ?? []).map(operationFromApi),
    recovery_operations: (action.recovery_operations ?? []).map(operationFromApi),
    update_operations: (action.update_operations ?? []).map(operationFromApi),
  };
}

// ─── Form → API mappers ───────────────────────────────────────────────────────

export function mapOperation(op: ActionFormOperationDraft) {
  return {
    operation_type: op.operation_type,
    op_step_from: op.op_step_from,
    op_step_to: op.op_step_to,
    op_step_duration: Number(op.op_step_duration) || 0,
    default_msg: op.default_msg,
    message_subject: op.message_subject,
    message_body: op.message_body,
    media_type_name: op.media_type,
    command_type: op.command_type,
    command: op.command,
    execute_on: op.execute_on,
  };
}

export function buildPayload(values: ActionFormValues): Record<string, unknown> {
  return {
    name: values.name.trim(),
    eventsource: values.eventsource,
    status: values.status,
    eval_type: values.eval_type,
    formula: values.eval_type === "custom" ? values.formula : "",
    esc_period: values.esc_period,
    pause_suppressed: values.pause_suppressed,
    pause_symptoms: values.pause_symptoms,
    notify_if_canceled: values.notify_if_canceled,
    conditions: values.conditions.map((c) => ({
      condition_type: c.condition_type,
      operator: c.operator,
      trigger_source: c.trigger_source,
      trigger_ids: c.trigger_id != null ? [c.trigger_id] : [],
      value: c.condition_type === "trigger" && c.trigger_id != null ? String(c.trigger_id) : c.value,
      value2: c.trigger_source,
      formula_id: c.formula_id,
    })),
    operations: values.operations.map(mapOperation),
    recovery_operations: values.recovery_operations.map(mapOperation),
    update_operations: values.update_operations.map(mapOperation),
  };
}

// ─── Misc helpers ─────────────────────────────────────────────────────────────

export function filterTriggersBySource(
  triggers: Trigger[],
  source: ActionFormConditionDraft["trigger_source"]
): Trigger[] {
  if (source === "template") {
    return triggers.filter((t) => t.template != null);
  }
  return triggers.filter((t) => t.template == null);
}
