import type { Template, TemplateMacro, TemplateValueMap, ValueMapMapping } from "@/types/monitoring";

export type TagDraft = { key: string; tag: string; value: string };
export type MacroDraft = { key: string } & TemplateMacro;
export type MappingDraft = { key: string } & ValueMapMapping;
export type ValueMapDraft = { key: string } & TemplateValueMap;

export function newKey() {
  return Math.random().toString(36).slice(2);
}

export function emptyTag(): TagDraft {
  return { key: newKey(), tag: "", value: "" };
}

export function emptyMacro(): MacroDraft {
  return { key: newKey(), macro: "", value: "", description: "" };
}

export function emptyMapping(): MappingDraft {
  return { key: newKey(), type: "0", value: "", newvalue: "" };
}

export function emptyValueMap(): ValueMapDraft {
  return { key: newKey(), name: "", mappings: [emptyMapping()] };
}

export function tagsFromTemplate(t: Template | null): TagDraft[] {
  if (!t?.tags?.length) return [emptyTag()];
  return t.tags.map((tag) => ({ key: newKey(), tag: tag.tag, value: tag.value }));
}

export function macrosFromTemplate(t: Template | null): MacroDraft[] {
  if (!t?.macros?.length) return [];
  return t.macros.map((m) => ({
    key: newKey(),
    macro: m.macro,
    value: m.value,
    description: m.description ?? "",
  }));
}

export function valueMapsFromTemplate(t: Template | null): ValueMapDraft[] {
  if (!t?.value_maps?.length) return [];
  return t.value_maps.map((vm) => ({
    key: newKey(),
    id: vm.id,
    name: vm.name,
    mappings: vm.mappings.length
      ? vm.mappings.map((m) => ({
          key: newKey(),
          type: m.type || "0",
          value: m.value ?? "",
          newvalue: m.newvalue,
        }))
      : [emptyMapping()],
  }));
}
