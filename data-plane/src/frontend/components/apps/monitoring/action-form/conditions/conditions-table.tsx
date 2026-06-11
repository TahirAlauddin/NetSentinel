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
import type { ActionFormConditionDraft, Host, Trigger } from "@/types/monitoring";
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
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(true);
  const [triggersByHost, setTriggersByHost] = useState<Record<number, Trigger[]>>({});
  const [loadingTriggerHostIds, setLoadingTriggerHostIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    api.getHosts().then((res) => {
      setHosts(Array.isArray(res.data) ? res.data : []);
      setLoadingHosts(false);
    });
  }, []);

  const loadTriggersForHost = async (hostId: number) => {
    if (triggersByHost[hostId] || loadingTriggerHostIds[hostId]) return;
    setLoadingTriggerHostIds((prev) => ({ ...prev, [hostId]: true }));
    const res = await api.getTriggers({ host: hostId });
    setTriggersByHost((prev) => ({
      ...prev,
      [hostId]: Array.isArray(res.data) ? res.data : [],
    }));
    setLoadingTriggerHostIds((prev) => ({ ...prev, [hostId]: false }));
  };

  const update = (key: string, patch: Partial<ActionFormConditionDraft>) =>
    onChange(conditions.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const remove = (key: string) => onChange(conditions.filter((c) => c.key !== key));

  const add = () => onChange([...conditions, emptyCondition()]);

  const selectTrigger = (key: string, triggerId: number | null) => {
    update(key, { trigger_id: triggerId });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">Conditions</CardTitle>
          <CardDescription>
            Filter by type, operator, trigger source (host or template), and one trigger per
            condition.
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
                const hostTriggers = c.host_id ? (triggersByHost[c.host_id] ?? []) : [];
                const available = filterTriggersBySource(hostTriggers, c.trigger_source);
                const loadingTriggers = c.host_id ? Boolean(loadingTriggerHostIds[c.host_id]) : false;
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
                      {c.condition_type === "trigger" ? (
                        <Select
                          value={c.trigger_source}
                          onValueChange={(v) =>
                            update(c.key, {
                              trigger_source: v as ActionFormConditionDraft["trigger_source"],
                              trigger_id: null,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 min-w-[120px]">
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
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <ConditionTriggersCell
                        condition={c}
                        hosts={hosts}
                        loadingHosts={loadingHosts}
                        loadingTriggers={loadingTriggers}
                        available={available}
                        allTriggers={hostTriggers}
                        onHostChange={(hostId) => {
                          update(c.key, { host_id: hostId, trigger_id: null });
                          if (hostId) {
                            void loadTriggersForHost(hostId);
                          }
                        }}
                        onSelectTrigger={(id) => selectTrigger(c.key, id)}
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
