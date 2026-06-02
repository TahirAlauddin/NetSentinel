"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ActionFormConditionDraft, Host, Trigger } from "@/types/monitoring";
import {
  TRIGGER_SEVERITY_OPTIONS,
  TRIGGER_VALUE_OPTIONS,
} from "../action-form-constants";

interface ConditionTriggersCellProps {
  condition: ActionFormConditionDraft;
  hosts: Host[];
  loadingHosts: boolean;
  loadingTriggers: boolean;
  available: Trigger[];
  allTriggers: Trigger[];
  onHostChange: (hostId: number | null) => void;
  onSelectTrigger: (id: number | null) => void;
  onValueChange: (value: string) => void;
}

export function ConditionTriggersCell({
  condition,
  hosts,
  loadingHosts,
  loadingTriggers,
  available,
  allTriggers,
  onHostChange,
  onSelectTrigger,
  onValueChange,
}: ConditionTriggersCellProps) {
  const [triggersOpen, setTriggersOpen] = useState(false);
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

  const selectedTrigger = condition.trigger_id
    ? allTriggers.find((t) => t.id === condition.trigger_id)
    : undefined;

  const selectedHost = condition.host_id
    ? hosts.find((h) => h.id === condition.host_id)
    : undefined;
  const hostLabel = selectedHost?.visible_name || selectedHost?.name;

  const triggerButtonLabel = !condition.host_id
    ? "Select host first"
    : loadingTriggers
      ? "Loading triggers…"
      : selectedTrigger?.name ?? "Select trigger";

  const closePicker = () => {
    setTriggersOpen(false);
    setTriggerSearch("");
  };

  return (
    <div className="space-y-2">
      <Select
        value={condition.host_id ? String(condition.host_id) : ""}
        onValueChange={(value) => {
          closePicker();
          onHostChange(value ? Number(value) : null);
        }}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder={loadingHosts ? "Loading hosts…" : "Select host"} />
        </SelectTrigger>
        <SelectContent>
          {hosts.map((host) => (
            <SelectItem key={host.id} value={String(host.id)}>
              {host.visible_name || host.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        className="h-8 w-full justify-between font-normal text-left"
        disabled={!condition.host_id || loadingTriggers}
        onClick={() => setTriggersOpen(true)}
      >
        <span className="truncate">{triggerButtonLabel}</span>
      </Button>

      <Dialog
        open={triggersOpen}
        onOpenChange={(open) => {
          setTriggersOpen(open);
          if (!open) setTriggerSearch("");
        }}
      >
        <DialogContent className="z-[60] gap-0 p-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>Select trigger</DialogTitle>
            <DialogDescription>
              {hostLabel
                ? `Choose one ${condition.trigger_source} trigger for ${hostLabel}.`
                : "Choose one trigger for this condition."}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-2">
            <Input
              className="h-8"
              placeholder="Search triggers…"
              value={triggerSearch}
              onChange={(e) => setTriggerSearch(e.target.value)}
            />
          </div>

          <div className="max-h-64 space-y-0.5 overflow-y-auto px-4 pb-2">
            {loadingTriggers ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">Loading…</p>
            ) : filtered.length === 0 ? (
              <p className="px-2 py-4 text-sm text-muted-foreground">No triggers found.</p>
            ) : (
              filtered.map((t) => {
                const isSelected = condition.trigger_id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={cn(
                      "flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors",
                      isSelected ? "bg-accent" : "hover:bg-muted"
                    )}
                    onClick={() => {
                      onSelectTrigger(t.id);
                      closePicker();
                    }}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {t.host_name ?? t.template_name ?? "—"}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <DialogFooter className="border-t px-6 py-4 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              disabled={condition.trigger_id == null}
              onClick={() => {
                onSelectTrigger(null);
                closePicker();
              }}
            >
              Clear
            </Button>
            <Button type="button" onClick={closePicker}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
