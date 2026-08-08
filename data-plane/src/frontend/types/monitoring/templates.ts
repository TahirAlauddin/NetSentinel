import type { TemplateGroup } from "./core";

// ─── Templates ────────────────────────────────────────────────────────────────

export interface TemplateTag {
  id: number;
  tag: string;
  value: string;
}

export interface TemplateMacro {
  macro: string;
  value: string;
  description?: string;
}

export interface ValueMapMapping {
  type: string;
  value: string;
  newvalue: string;
}

export interface TemplateValueMap {
  id?: number;
  name: string;
  mappings: ValueMapMapping[];
}

export interface Template {
  id: number;
  name: string;
  technical_name: string;
  visible_name: string;
  description: string;
  template_groups: number[];
  template_groups_detail: TemplateGroup[];
  linked_templates: number[];
  linked_templates_detail: { id: number; name: string }[];
  tags: TemplateTag[];
  macros: TemplateMacro[];
  value_maps: TemplateValueMap[];
  item_count: number;
  trigger_count: number;
  created_at: string;
  updated_at: string;
}

export interface TemplateFormData {
  name: string;
  visible_name?: string;
  description?: string;
  template_groups?: number[];
  linked_templates?: number[];
  tags?: { tag: string; value: string }[];
  macros?: TemplateMacro[];
  value_maps?: TemplateValueMap[];
}
