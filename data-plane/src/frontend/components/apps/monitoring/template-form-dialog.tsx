"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Template, TemplateFormData, TemplateGroup } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";
import {
  emptyTag,
  macrosFromTemplate,
  tagsFromTemplate,
  valueMapsFromTemplate,
  type MacroDraft,
  type TagDraft,
  type ValueMapDraft,
} from "./template-form-dialog-helpers";
import { TemplateTagsTab } from "./template-tags-tab";
import { TemplateMacrosTab } from "./template-macros-tab";
import { TemplateValueMapsTab } from "./template-value-maps-tab";

const api = new MonitoringApiClient();

interface TemplateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Template | null;
  templateGroups: TemplateGroup[];
  allTemplates: Template[];
  defaultGroupIds?: number[];
  onSaved: () => void;
}

export function TemplateFormDialog({
  open,
  onOpenChange,
  editing,
  templateGroups,
  allTemplates,
  defaultGroupIds = [],
  onSaved,
}: TemplateFormDialogProps) {
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState<Template | null>(null);
  const [technicalName, setTechnicalName] = useState("");
  const [visibleName, setVisibleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [linkedTemplates, setLinkedTemplates] = useState<number[]>([]);
  const [tags, setTags] = useState<TagDraft[]>([emptyTag()]);
  const [macros, setMacros] = useState<MacroDraft[]>([]);
  const [valueMaps, setValueMaps] = useState<ValueMapDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const source = detail ?? editing;

  useEffect(() => {
    if (!open) return;

    const resetFrom = (t: Template | null) => {
      setTechnicalName(t?.technical_name ?? t?.name ?? "");
      setVisibleName(t?.visible_name ?? t?.name ?? "");
      setDescription(t?.description ?? "");
      setSelectedGroups(t?.template_groups ?? defaultGroupIds);
      setLinkedTemplates(t?.linked_templates ?? []);
      setTags(tagsFromTemplate(t));
      setMacros(macrosFromTemplate(t));
      setValueMaps(valueMapsFromTemplate(t));
    };

    if (!editing) {
      // Resetting local form state to match the dialog's open/editing props is
      // exactly the "sync with an external system" case effects are for.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDetail(null);
      resetFrom(null);
      return;
    }

    let cancelled = false;
    setLoadingDetail(true);
    void (async () => {
      const res = await api.getTemplate(editing.id);
      if (cancelled) return;
      const full = res.data ?? editing;
      setDetail(full);
      resetFrom(full);
      setLoadingDetail(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, editing, defaultGroupIds]);

  const linkableTemplates = useMemo(
    () => allTemplates.filter((t) => t.id !== (source?.id ?? editing?.id)),
    [allTemplates, source?.id, editing?.id]
  );

  const groupPickerGroups = useMemo(() => {
    if (selectedGroups.length === 0) return templateGroups;
    const selected = templateGroups.filter((g) => selectedGroups.includes(g.id));
    const rest = templateGroups.filter((g) => !selectedGroups.includes(g.id));
    return [...selected, ...rest];
  }, [templateGroups, selectedGroups]);

  const toggleGroup = (id: number) =>
    setSelectedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );

  const toggleLinkedTemplate = (id: number) =>
    setLinkedTemplates((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const buildPayload = (): TemplateFormData => ({
    name: technicalName.trim(),
    visible_name: visibleName.trim() || technicalName.trim(),
    description,
    template_groups: selectedGroups,
    linked_templates: linkedTemplates,
    tags: tags
      .filter((t) => t.tag.trim())
      .map((t) => ({ tag: t.tag.trim(), value: t.value.trim() })),
    macros: macros
      .filter((m) => m.macro.trim())
      .map((m) => ({
        macro: m.macro.trim(),
        value: m.value,
        description: m.description?.trim() || undefined,
      })),
    value_maps: valueMaps
      .filter((vm) => vm.name.trim() && (!source || !vm.id))
      .map((vm) => ({
        name: vm.name.trim(),
        mappings: vm.mappings
          .filter((m) => m.newvalue.trim())
          .map((m) => ({
            type: m.type || "0",
            value: m.value.trim(),
            newvalue: m.newvalue.trim(),
          })),
      }))
      .filter((vm) => vm.mappings.length > 0),
  });

  const handleSave = async () => {
    if (!technicalName.trim()) return;
    if (selectedGroups.length === 0) {
      toast.error("Select at least one template group.");
      return;
    }
    setSaving(true);
    const payload = buildPayload();
    const res = source
      ? await api.updateTemplate(source.id, payload)
      : await api.createTemplate(payload);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(source ? "Template updated." : "Template created.");
      onOpenChange(false);
      onSaved();
    }
  };

  const isEdit = Boolean(source);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{isEdit ? "Edit Template" : "Create Template"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 min-h-0">
          {loadingDetail ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading template…</div>
          ) : (
            <Tabs defaultValue="general" className="pb-4">
              <TabsList className="mb-4 flex flex-wrap h-auto gap-1">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="linked">Templates</TabsTrigger>
                <TabsTrigger value="tags">Tags</TabsTrigger>
                <TabsTrigger value="macros">Macros</TabsTrigger>
                <TabsTrigger value="valuemaps">Value mapping</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>
                      Template name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={technicalName}
                      onChange={(e) => setTechnicalName(e.target.value)}
                      placeholder="e.g. Linux by Zabbix agent"
                    />
                    <p className="text-xs text-muted-foreground">
                      Technical name (Zabbix <code className="text-xs">host</code>).
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Visible name</Label>
                    <Input
                      value={visibleName}
                      onChange={(e) => setVisibleName(e.target.value)}
                      placeholder="Display name in the UI"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Template description"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Template groups <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Zabbix requires at least one group per template.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {groupPickerGroups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          selectedGroups.includes(g.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                    {templateGroups.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No template groups yet. Create one using the panel above.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="linked" className="mt-0">
                <p className="text-sm text-muted-foreground mb-3">
                  Link parent templates to inherit their items, triggers, and other entities.
                </p>
                <div className="flex flex-wrap gap-2">
                  {linkableTemplates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleLinkedTemplate(t.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        linkedTemplates.includes(t.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {t.visible_name || t.name}
                    </button>
                  ))}
                  {linkableTemplates.length === 0 && (
                    <p className="text-sm text-muted-foreground">No other templates available.</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tags" className="mt-0 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Name/value tags for filtering and correlation.</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setTags((t) => [...t, emptyTag()])}>
                    <Plus className="h-4 w-4 mr-1" /> Add tag
                  </Button>
                </div>
                {tags.map((row, index) => (
                  <div key={row.key} className="flex gap-2 items-start">
                    <div className="flex-1 grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Tag name"
                        value={row.tag}
                        onChange={(e) =>
                          setTags((prev) =>
                            prev.map((t, i) => (i === index ? { ...t, tag: e.target.value } : t))
                          )
                        }
                      />
                      <Input
                        placeholder="Value"
                        value={row.value}
                        onChange={(e) =>
                          setTags((prev) =>
                            prev.map((t, i) => (i === index ? { ...t, value: e.target.value } : t))
                          )
                        }
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={tags.length <= 1}
                      onClick={() => setTags((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="macros" className="mt-0 space-y-3">
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
                            setMacros((prev) =>
                              prev.map((m, i) => (i === index ? { ...m, macro: e.target.value } : m))
                            )
                          }
                        />
                        <Input
                          placeholder="Value"
                          value={row.value}
                          onChange={(e) =>
                            setMacros((prev) =>
                              prev.map((m, i) => (i === index ? { ...m, value: e.target.value } : m))
                            )
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
              </TabsContent>

              <TabsContent value="valuemaps" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Map raw item values to human-readable labels.
                  </p>
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
                                  i === vmIndex
                                    ? { ...v, mappings: [...v.mappings, emptyMapping()] }
                                    : v
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
                                      ? {
                                          ...v,
                                          mappings: v.mappings.filter((_, j) => j !== mIndex),
                                        }
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
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loadingDetail || !technicalName.trim() || selectedGroups.length === 0}
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
