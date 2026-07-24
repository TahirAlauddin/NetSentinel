"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyMacro, type MacroDraft } from "./template-form-dialog-helpers";

interface TemplateMacrosTabProps {
  macros: MacroDraft[];
  setMacros: React.Dispatch<React.SetStateAction<MacroDraft[]>>;
}

export function TemplateMacrosTab({ macros, setMacros }: TemplateMacrosTabProps) {
  return (
    <div className="mt-0 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          User macros (e.g. <code className="text-xs">{"{$SNMP_COMMUNITY}"}</code>).
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setMacros((m) => [...m, emptyMacro()])}>
          <Plus className="h-4 w-4 mr-1" /> Add macro
        </Button>
      </div>
      {macros.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No macros defined.</p>
      ) : (
        macros.map((row, index) => (
          <div key={row.key} className="rounded-lg border p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-muted-foreground">Macro {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setMacros((prev) => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="{$MACRO}"
                className="font-mono text-sm"
                value={row.macro}
                onChange={(e) =>
                  setMacros((prev) => prev.map((m, i) => (i === index ? { ...m, macro: e.target.value } : m)))
                }
              />
              <Input
                placeholder="Value"
                value={row.value}
                onChange={(e) =>
                  setMacros((prev) => prev.map((m, i) => (i === index ? { ...m, value: e.target.value } : m)))
                }
              />
            </div>
            <Input
              placeholder="Description (optional)"
              value={row.description ?? ""}
              onChange={(e) =>
                setMacros((prev) =>
                  prev.map((m, i) => (i === index ? { ...m, description: e.target.value } : m))
                )
              }
            />
          </div>
        ))
      )}
    </div>
  );
}
