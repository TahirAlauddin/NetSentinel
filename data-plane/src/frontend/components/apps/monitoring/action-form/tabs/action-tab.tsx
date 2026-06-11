"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionFormValues } from "@/types/monitoring";
import { ACTION_EVENT_SOURCES } from "../action-form-constants";

interface ActionTabProps {
  values: ActionFormValues;
  onChange: <K extends keyof ActionFormValues>(key: K, val: ActionFormValues[K]) => void;
}

export function ActionTab({ values, onChange }: ActionTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">General</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="action-name">Name *</Label>
          <Input
            id="action-name"
            value={values.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Notify administrators on problem"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Event source</Label>
          <Select
            value={values.eventsource}
            onValueChange={(v) => onChange("eventsource", v as ActionFormValues["eventsource"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_EVENT_SOURCES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <Label htmlFor="action-enabled" className="text-sm font-medium">
              Enabled
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Disabled actions are not evaluated.
            </p>
          </div>
          <Switch
            id="action-enabled"
            checked={values.status === "enabled"}
            onCheckedChange={(on) => onChange("status", on ? "enabled" : "disabled")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
