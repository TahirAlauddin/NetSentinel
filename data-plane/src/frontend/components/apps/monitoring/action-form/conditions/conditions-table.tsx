"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ActionFormConditionDraft, Trigger } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";
import {
  CONDITION_OPERATORS,
  CONDITION_TYPES,
  TRIGGER_SOURCES,
} from "../action-form-constants";
import { emptyCondition, filterTriggersBySource } from "../utils";
import { ConditionTriggersCell } from "./condition-triggers-cell";

const api = new MonitoringApiClient();

interface ConditionsTableProps {
  conditions: ActionFormConditionDraft[];
  evalType: string;
  onChange: (conditions: ActionFormConditionDraft[]) => void;
}

export function ConditionsTable({ conditions, evalType, onChange }: ConditionsTableProps) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loadingTriggers, setLoadingTriggers] = useState(true);

  useEffect(() => {
    api.getTriggers().then((res) => {
      setTriggers(Array.isArray(res.data) ? res.data : []);
      setLoadingTriggers(false);
    });
  }, []);

  const update = (key: string, patch: Partial<ActionFormConditionDraft>) =>
    onChange(conditions.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const remove = (key: string) => onChange(conditions.filter((c) => c.key !== key));

  const add = () => onChange([...conditions, emptyCondition()]);

  const toggleTrigger = (key: string, triggerId: number, checked: boolean) => {
    const row = conditions.find((c) => c.key === key);
    if (!row) return;
    const ids = checked
      ? [...row.trigger_ids, triggerId]
      : row.trigger_ids.filter((id) => id !== triggerId);
    update(key, { trigger_ids: ids });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Conditions</CardTitle>
          <CardDescription>
            Filter by type, operator, trigger source, and specific triggers.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-6 pb-6">
            No conditions — action applies to all matching events for the source.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {evalType === "and_or" && <TableHead className="w-14">Label</TableHead>}
                <TableHead>Type</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Trigger source</TableHead>
                <TableHead>Triggers</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {conditions.map((c) => {
                const available = filterTriggersBySource(triggers, c.trigger_source);
                return (
                  <TableRow key={c.key}>
                    {evalType === "and_or" && (
                      <TableCell>
                        <Input
                          className="h-8 w-12"
                          value={c.formula_id}
                          onChange={(e) => update(c.key, { formula_id: e.target.value })}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Select
                        value={c.condition_type}
                        onValueChange={(v) => update(c.key, { condition_type: v })}
                      >
                        <SelectTrigger className="h-8 min-w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.operator}
                        onValueChange={(v) => update(c.key, { operator: v })}
                      >
                        <SelectTrigger className="h-8 min-w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={c.trigger_source}
                        onValueChange={(v) =>
                          update(c.key, {
                            trigger_source: v as ActionFormConditionDraft["trigger_source"],
                            trigger_ids: [],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 min-w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRIGGER_SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <ConditionTriggersCell
                        condition={c}
                        loadingTriggers={loadingTriggers}
                        available={available}
                        allTriggers={triggers}
                        onToggleTrigger={(id, checked) => toggleTrigger(c.key, id, checked)}
                        onValueChange={(value) => update(c.key, { value })}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => remove(c.key)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
