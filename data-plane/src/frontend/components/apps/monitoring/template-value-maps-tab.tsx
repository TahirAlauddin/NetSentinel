"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyMapping, emptyValueMap, type ValueMapDraft } from "./template-form-dialog-helpers";

interface TemplateValueMapsTabProps {
  valueMaps: ValueMapDraft[];
  setValueMaps: React.Dispatch<React.SetStateAction<ValueMapDraft[]>>;
  isEdit: boolean;
}

export function TemplateValueMapsTab({ valueMaps, setValueMaps, isEdit }: TemplateValueMapsTabProps) {
  return (
    <div className="mt-0 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Map raw item values to human-readable labels.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setValueMaps((v) => [...v, emptyValueMap()])}
        >
          <Plus className="h-4 w-4 mr-1" /> Add value map
        </Button>
      </div>
      {valueMaps.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No value maps. Add one to create mappings after save.
        </p>
      ) : (
        valueMaps.map((vm, vmIndex) => (
          <div key={vm.key} className="rounded-lg border p-3 space-y-3">
            <div className="flex gap-2 items-center">
              <Input
                className="flex-1"
                placeholder="Value map name"
                value={vm.name}
                onChange={(e) =>
                  setValueMaps((prev) =>
                    prev.map((v, i) => (i === vmIndex ? { ...v, name: e.target.value } : v))
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setValueMaps((prev) => prev.filter((_, i) => i !== vmIndex))}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Mappings</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setValueMaps((prev) =>
                      prev.map((v, i) =>
                        i === vmIndex ? { ...v, mappings: [...v.mappings, emptyMapping()] } : v
                      )
                    )
                  }
                >
                  <Plus className="h-3 w-3 mr-1" /> Add row
                </Button>
              </div>
              {vm.mappings.map((m, mIndex) => (
                <div key={m.key} className="flex gap-2 items-center">
                  <Input
                    className="w-24 font-mono text-sm"
                    placeholder="Value"
                    value={m.value}
                    onChange={(e) =>
                      setValueMaps((prev) =>
                        prev.map((v, i) =>
                          i === vmIndex
                            ? {
                                ...v,
                                mappings: v.mappings.map((row, j) =>
                                  j === mIndex ? { ...row, value: e.target.value } : row
                                ),
                              }
                            : v
                        )
                      )
                    }
                  />
                  <span className="text-muted-foreground text-sm">→</span>
                  <Input
                    className="flex-1"
                    placeholder="Mapped to"
                    value={m.newvalue}
                    onChange={(e) =>
                      setValueMaps((prev) =>
                        prev.map((v, i) =>
                          i === vmIndex
                            ? {
                                ...v,
                                mappings: v.mappings.map((row, j) =>
                                  j === mIndex ? { ...row, newvalue: e.target.value } : row
                                ),
                              }
                            : v
                        )
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={vm.mappings.length <= 1}
                    onClick={() =>
                      setValueMaps((prev) =>
                        prev.map((v, i) =>
                          i === vmIndex
                            ? { ...v, mappings: v.mappings.filter((_, j) => j !== mIndex) }
                            : v
                        )
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            {isEdit && vm.id && (
              <p className="text-xs text-muted-foreground">
                Existing value map (read-only here). Add a new value map to create more.
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
