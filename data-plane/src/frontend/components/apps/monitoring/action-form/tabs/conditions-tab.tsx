"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActionFormValues } from "@/types/monitoring";
import { ACTION_EVAL_TYPES } from "../action-form-constants";
import { ConditionsTable } from "../conditions/conditions-table";

interface ConditionsTabProps {
  values: ActionFormValues;
  onChange: <K extends keyof ActionFormValues>(key: K, val: ActionFormValues[K]) => void;
}

export function ConditionsTab({ values, onChange }: ConditionsTabProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Condition evaluation</CardTitle>
          <CardDescription>
            All conditions must match according to the evaluation mode.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Type of calculation</Label>
            <Select
              value={values.eval_type}
              onValueChange={(v) => onChange("eval_type", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_EVAL_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {values.eval_type === "custom" && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Custom expression</Label>
              <Input
                value={values.formula}
                onChange={(e) => onChange("formula", e.target.value)}
                placeholder="A and (B or C)"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConditionsTable
        conditions={values.conditions}
        evalType={values.eval_type}
        onChange={(conditions) => onChange("conditions", conditions)}
      />
    </>
  );
}
