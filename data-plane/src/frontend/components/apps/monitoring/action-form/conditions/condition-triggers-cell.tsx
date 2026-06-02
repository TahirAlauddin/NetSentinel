"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ActionFormConditionDraft, Trigger } from "@/types/monitoring";
import {
  TRIGGER_SEVERITY_OPTIONS,
  TRIGGER_VALUE_OPTIONS,
} from "../action-form-constants";

interface ConditionTriggersCellProps {
  condition: ActionFormConditionDraft;
  loadingTriggers: boolean;
  available: Trigger[];
  allTriggers: Trigger[];
  onToggleTrigger: (id: number, checked: boolean) => void;
  onValueChange: (value: string) => void;
}

export function ConditionTriggersCell({
  condition,
  loadingTriggers,
  available,
  allTriggers,
  onToggleTrigger,
  onValueChange,
}: ConditionTriggersCellProps) {
  const [triggerSearch, setTriggerSearch] = useState("");

  const search = triggerSearch.toLowerCase();
  const filtered = search
    ? available.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          (t.host_name?.toLowerCase().includes(search) ?? false) ||
          (t.template_name?.toLowerCase().includes(search) ?? false)
      )
    : available;

  if (condition.condition_type === "trigger_severity") {
    return (
      <Select value={condition.value || "average"} onValueChange={onValueChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_SEVERITY_OPTIONS.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (condition.condition_type === "trigger_value") {
    return (
      <Select value={condition.value || "problem"} onValueChange={onValueChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Trigger value" />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_VALUE_OPTIONS.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (condition.condition_type !== "trigger") {
    return (
      <Input
        className="h-8"
        value={condition.value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={
          condition.condition_type === "trigger_name" ? "Trigger name pattern" : "Value"
        }
      />
    );
  }

  const selectedLabels = condition.trigger_ids
    .map((id) => allTriggers.find((t) => t.id === id)?.name)
    .filter(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-full justify-between font-normal text-left"
        >
          <span className="truncate">
            {loadingTriggers
              ? "Loading triggers…"
              : condition.trigger_ids.length === 0
                ? "Select triggers"
                : selectedLabels.length <= 2
                  ? selectedLabels.join(", ")
                  : `${condition.trigger_ids.length} triggers selected`}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            className="h-8"
            placeholder="Search triggers…"
            value={triggerSearch}
            onChange={(e) => setTriggerSearch(e.target.value)}
          />
        </div>
        <div className="max-h-56 overflow-y-auto p-2 space-y-1">
          {loadingTriggers ? (
            <p className="text-xs text-muted-foreground px-1 py-2">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-muted-foreground px-1 py-2">No triggers found.</p>
          ) : (
            filtered.map((t) => (
              <label
                key={t.id}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox
                  className="mt-0.5"
                  checked={condition.trigger_ids.includes(t.id)}
                  onCheckedChange={(checked) => onToggleTrigger(t.id, Boolean(checked))}
                />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.name}</span>
                  <span className="block text-xs text-muted-foreground truncate">
                    {t.host_name ?? t.template_name ?? "—"}
                  </span>
                </span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
