"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { emptyTag, type TagDraft } from "./template-form-dialog-helpers";

interface TemplateTagsTabProps {
  tags: TagDraft[];
  setTags: React.Dispatch<React.SetStateAction<TagDraft[]>>;
}

export function TemplateTagsTab({ tags, setTags }: TemplateTagsTabProps) {
  return (
    <div className="mt-0 space-y-3">
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
                setTags((prev) => prev.map((t, i) => (i === index ? { ...t, tag: e.target.value } : t)))
              }
            />
            <Input
              placeholder="Value"
              value={row.value}
              onChange={(e) =>
                setTags((prev) => prev.map((t, i) => (i === index ? { ...t, value: e.target.value } : t)))
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
    </div>
  );
}
