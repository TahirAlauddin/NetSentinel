"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Action, ActionFormValues } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";
import { actionToFormValues, buildPayload, defaultActionFormValues } from "./utils";
import { ActionTab } from "./tabs/action-tab";
import { ConditionsTab } from "./tabs/conditions-tab";
import { OperationsTab } from "./tabs/operations-tab";

const api = new MonitoringApiClient();

interface ActionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: Action | null;
  onSaved: () => void;
}

export function ActionFormDialog({
  open,
  onOpenChange,
  action,
  onSaved,
}: ActionFormDialogProps) {
  const isEdit = Boolean(action?.id);
  const [values, setValues] = useState<ActionFormValues>(defaultActionFormValues);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("action");

  const setField = useCallback(
    <K extends keyof ActionFormValues>(key: K, val: ActionFormValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: val }));
    },
    []
  );

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const initialize = async () => {
      await Promise.resolve();
      if (!isMounted) return;

      setActiveTab("action");
      if (!action?.id) {
        setValues(defaultActionFormValues());
        setLoadingDetail(false);
        return;
      }

      setValues(actionToFormValues(action));
      setLoadingDetail(true);
      const res = await api.getAction(action.id);
      if (!isMounted) return;

      setLoadingDetail(false);
      if (res.data) setValues(actionToFormValues(res.data));
    };

    void initialize();
    return () => {
      isMounted = false;
    };
  }, [open, action]);

  const handleSave = async () => {
    if (!values.name.trim()) {
      toast.error("Action name is required.");
      setActiveTab("action");
      return;
    }
    setSaving(true);
    const payload = buildPayload(values);
    const res = isEdit
      ? await api.updateAction(action!.id, payload as Partial<Action>)
      : await api.createAction(payload as Partial<Action>);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(isEdit ? "Action updated." : "Action created.");
    onOpenChange(false);
    onSaved();
  };

  const isTriggerSource = values.eventsource === "trigger";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>{isEdit ? "Edit action" : "Create action"}</DialogTitle>
          <DialogDescription>
            Configure conditions and operations like Zabbix — problem steps, recovery, and
            updates run when events match.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {loadingDetail ? (
            <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
              Loading action…
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full justify-start">
                <TabsTrigger value="action">Action</TabsTrigger>
                <TabsTrigger value="conditions">
                  Conditions
                  {values.conditions.length > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({values.conditions.length})
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
              </TabsList>

              <TabsContent value="action" className="space-y-4 mt-0">
                <ActionTab values={values} onChange={setField} />
              </TabsContent>

              <TabsContent value="conditions" className="space-y-4 mt-0">
                <ConditionsTab values={values} onChange={setField} />
              </TabsContent>

              <TabsContent value="operations" className="space-y-4 mt-0">
                <OperationsTab
                  values={values}
                  isTriggerSource={isTriggerSource}
                  onChange={setField}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingDetail || !values.name.trim()}
          >
            {saving ? "Saving…" : isEdit ? "Update action" : "Create action"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
