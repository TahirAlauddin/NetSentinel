"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionFormOperationDraft } from "@/types/monitoring";
import {
  COMMAND_TYPES,
  EXECUTE_ON_OPTIONS,
  OPERATION_TYPES,
} from "../action-form-constants";

interface OperationRowProps {
  op: ActionFormOperationDraft;
  index: number;
  sectionTitle: string;
  showSteps: boolean;
  onUpdate: (patch: Partial<ActionFormOperationDraft>) => void;
  onRemove: () => void;
}

export function OperationRow({
  op,
  index,
  sectionTitle,
  showSteps,
  onUpdate,
  onRemove,
}: OperationRowProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          {sectionTitle} {index + 1}
        </span>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={onRemove}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Operation</Label>
          <Select
            value={op.operation_type}
            onValueChange={(v) => onUpdate({ operation_type: v })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showSteps && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">Step from</Label>
              <Input
                type="number"
                min={1}
                className="h-8"
                value={op.op_step_from}
                onChange={(e) => onUpdate({ op_step_from: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Step to</Label>
              <Input
                type="number"
                min={1}
                className="h-8"
                value={op.op_step_to}
                onChange={(e) => onUpdate({ op_step_to: Number(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Step duration (sec, 0 = default)</Label>
              <Input
                className="h-8"
                value={op.op_step_duration}
                onChange={(e) => onUpdate({ op_step_duration: e.target.value })}
              />
            </div>
          </>
        )}
      </div>

      {op.operation_type === "send_message" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={op.default_msg}
                onCheckedChange={(c) => onUpdate({ default_msg: Boolean(c) })}
              />
              Default message
            </label>
          </div>
          {!op.default_msg && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input
                  className="h-8"
                  value={op.message_subject}
                  onChange={(e) => onUpdate({ message_subject: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs">Message</Label>
                <Textarea
                  rows={2}
                  value={op.message_body}
                  onChange={(e) => onUpdate({ message_body: e.target.value })}
                />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Media type</Label>
            <Input
              className="h-8"
              value={op.media_type}
              onChange={(e) => onUpdate({ media_type: e.target.value })}
              placeholder="e.g. Email"
            />
          </div>
        </div>
      )}

      {op.operation_type === "remote_command" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Command type</Label>
            <Select
              value={op.command_type}
              onValueChange={(v) => onUpdate({ command_type: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMAND_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Execute on</Label>
            <Select
              value={op.execute_on}
              onValueChange={(v) => onUpdate({ execute_on: v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXECUTE_ON_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Command</Label>
            <Input
              className="h-8 font-mono text-sm"
              value={op.command}
              onChange={(e) => onUpdate({ command: e.target.value })}
              placeholder="systemctl restart my-service"
            />
          </div>
        </div>
      )}
    </div>
  );
}
