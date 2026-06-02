export const ACTION_EVENT_SOURCES = [
  { value: "trigger", label: "Trigger" },
  { value: "discovery", label: "Discovery" },
  { value: "autoregistration", label: "Autoregistration" },
  { value: "internal", label: "Internal" },
] as const;

export const ACTION_EVAL_TYPES = [
  { value: "and", label: "And" },
  { value: "or", label: "Or" },
  { value: "and_or", label: "And/Or" },
  { value: "custom", label: "Custom expression" },
] as const;

export const CONDITION_TYPES = [
  { value: "trigger", label: "Trigger" },
  { value: "trigger_severity", label: "Trigger severity" },
  { value: "trigger_name", label: "Trigger name" },
  { value: "trigger_value", label: "Trigger value" },
  { value: "host", label: "Host" },
  { value: "host_group", label: "Host group" },
  { value: "template", label: "Template" },
  { value: "event_name", label: "Event name" },
  { value: "event_acknowledged", label: "Event acknowledged" },
  { value: "maintenance_status", label: "Maintenance status" },
  { value: "time_period", label: "Time period" },
  { value: "tag", label: "Tag" },
  { value: "tag_value", label: "Tag value" },
] as const;

export const TRIGGER_SOURCES = [
  { value: "all", label: "All triggers" },
  { value: "host", label: "Host triggers" },
  { value: "template", label: "Template triggers" },
] as const;

export const TRIGGER_VALUE_OPTIONS = [
  { value: "problem", label: "Problem" },
  { value: "ok", label: "OK" },
] as const;

export const TRIGGER_SEVERITY_OPTIONS = [
  { value: "not_classified", label: "Not classified" },
  { value: "information", label: "Information" },
  { value: "warning", label: "Warning" },
  { value: "average", label: "Average" },
  { value: "high", label: "High" },
  { value: "disaster", label: "Disaster" },
] as const;

export const CONDITION_OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "like", label: "contains" },
  { value: "not_like", label: "does not contain" },
  { value: "in", label: "in" },
  { value: "not_in", label: "not in" },
  { value: "gte", label: "greater than or equals" },
  { value: "lte", label: "less than or equals" },
] as const;

export const OPERATION_TYPES = [
  { value: "send_message", label: "Send message" },
  { value: "remote_command", label: "Remote command" },
  { value: "add_host", label: "Add host" },
  { value: "remove_host", label: "Remove host" },
  { value: "add_to_host_group", label: "Add to host group" },
  { value: "remove_from_host_group", label: "Remove from host group" },
  { value: "link_template", label: "Link template" },
  { value: "unlink_template", label: "Unlink template" },
  { value: "enable_host", label: "Enable host" },
  { value: "disable_host", label: "Disable host" },
] as const;

export const COMMAND_TYPES = [
  { value: "custom_script", label: "Custom script" },
  { value: "ipmi", label: "IPMI" },
  { value: "ssh", label: "SSH" },
  { value: "telnet", label: "Telnet" },
] as const;

export const EXECUTE_ON_OPTIONS = [
  { value: "server", label: "Zabbix server" },
  { value: "agent", label: "Zabbix agent" },
  { value: "server_default", label: "Server (default)" },
] as const;

export const ESC_PERIOD_PRESETS = [
  { value: "60", label: "60 seconds" },
  { value: "300", label: "5 minutes" },
  { value: "3600", label: "1 hour" },
  { value: "86400", label: "1 day" },
] as const;
