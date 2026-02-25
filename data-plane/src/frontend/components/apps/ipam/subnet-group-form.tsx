"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SubnetGroup } from "@/types/ipam";
import { SubnetGroupCreateUpdateDto } from "@/types/ipam/dto";

interface SubnetGroupFormProps {
  group?: SubnetGroup;
  onSubmit: (data: SubnetGroupCreateUpdateDto) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function SubnetGroupForm({ group, onSubmit, onCancel, loading }: SubnetGroupFormProps) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        name,
        description: description || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save subnet group");
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : group ? "Update Subnet Group" : "Create Subnet Group"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

