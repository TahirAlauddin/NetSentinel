"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionFormValues } from "@/types/monitoring";
import { ESC_PERIOD_PRESETS } from "../action-form-constants";
import { OperationsSection } from "../operations/operations-section";

interface OperationsTabProps {
  values: ActionFormValues;
  isTriggerSource: boolean;
  onChange: <K extends keyof ActionFormValues>(key: K, val: ActionFormValues[K]) => void;
}

export function OperationsTab({ values, isTriggerSource, onChange }: OperationsTabProps) {
  const isPreset = ESC_PERIOD_PRESETS.some((p) => p.value === values.esc_period);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Escalation options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5 max-w-xs">
            <Label>Default operation step duration</Label>
            <div className="flex gap-2">
              <Select
                value={isPreset ? values.esc_period : "custom"}
                onValueChange={(v) => {
                  if (v !== "custom") onChange("esc_period", v);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Duration" />
                </SelectTrigger>
                <SelectContent>
                  {ESC_PERIOD_PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom (seconds)</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="w-28"
                value={values.esc_period}
                onChange={(e) => onChange("esc_period", e.target.value)}
                placeholder="sec"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 60 seconds. Used when an operation step duration is 0.
            </p>
          </div>

          {isTriggerSource && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Pause operations</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={values.pause_symptoms}
                  onCheckedChange={(c) => onChange("pause_symptoms", Boolean(c))}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  Pause operations for symptom problems
                  <span className="block text-xs text-muted-foreground">
                    Do not escalate while the event is a symptom of another problem.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={values.pause_suppressed}
                  onCheckedChange={(c) => onChange("pause_suppressed", Boolean(c))}
                  className="mt-0.5"
                />
                <span className="text-sm">
                  Pause operations for suppressed problems
                  <span className="block text-xs text-muted-foreground">
                    Pause escalation during maintenance or manual suppression.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={values.notify_if_canceled}
                  onCheckedChange={(c) => onChange("notify_if_canceled", Boolean(c))}
                  className="mt-0.5"
                />
                <span className="text-sm">Notify about canceled events</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <OperationsSection
        title="Operations"
        description="Steps executed when a problem is created. Add multiple steps for escalation."
        operations={values.operations}
        showSteps
        onChange={(ops) => onChange("operations", ops)}
      />

      {isTriggerSource && (
        <>
          <OperationsSection
            title="Recovery operations"
            description="Executed when a problem is resolved."
            operations={values.recovery_operations}
            showSteps={false}
            onChange={(ops) => onChange("recovery_operations", ops)}
          />
          <OperationsSection
            title="Update operations"
            description="Executed when a problem is updated (acknowledged, commented, severity changed)."
            operations={values.update_operations}
            showSteps={false}
            onChange={(ops) => onChange("update_operations", ops)}
          />
        </>
      )}
    </>
  );
}
