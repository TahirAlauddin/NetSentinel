"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActionFormOperationDraft } from "@/types/monitoring";
import { emptyOperation } from "../utils";
import { OperationRow } from "./operation-row";

interface OperationsSectionProps {
  title: string;
  description: string;
  operations: ActionFormOperationDraft[];
  showSteps: boolean;
  onChange: (ops: ActionFormOperationDraft[]) => void;
}

export function OperationsSection({
  title,
  description,
  operations,
  showSteps,
  onChange,
}: OperationsSectionProps) {
  const update = (key: string, patch: Partial<ActionFormOperationDraft>) =>
    onChange(operations.map((o) => (o.key === key ? { ...o, ...patch } : o)));

  const remove = (key: string) => onChange(operations.filter((o) => o.key !== key));

  const add = () => onChange([...operations, emptyOperation()]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {operations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No operations defined.</p>
        ) : (
          operations.map((op, index) => (
            <OperationRow
              key={op.key}
              op={op}
              index={index}
              sectionTitle={title}
              showSteps={showSteps}
              onUpdate={(patch) => update(op.key, patch)}
              onRemove={() => remove(op.key)}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
