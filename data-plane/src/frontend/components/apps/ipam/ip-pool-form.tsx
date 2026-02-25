"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IPPool, Subnet } from "@/types/ipam";
import { api } from "@/lib/utils";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface IpPoolFormProps {
  pool?: IPPool;
  onSubmit: (data: Partial<IPPool>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function IpPoolForm({ pool, onSubmit, onCancel, loading }: IpPoolFormProps) {
  const [subnet, setSubnet] = useState(pool?.subnet?.toString() || "");
  const [name, setName] = useState(pool?.name || "");
  const [description, setDescription] = useState(pool?.description || "");
  const [startIp, setStartIp] = useState(pool?.start_ip || "");
  const [endIp, setEndIp] = useState(pool?.end_ip || "");
  const [reservationPolicy, setReservationPolicy] = useState<"none" | "percentage" | "fixed">(
    pool?.reservation_policy || "none"
  );
  const [reservedPercentage, setReservedPercentage] = useState(
    pool?.reserved_percentage?.toString() || "0"
  );
  const [reservedCount, setReservedCount] = useState(pool?.reserved_count?.toString() || "0");
  const [isActive, setIsActive] = useState(pool?.is_active ?? true);
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubnets = async () => {
      try {
        const res = await api.get("/ipam/subnets/");
        if (res.data) {
          const subnetsData = extractIpamArrayData(res.data);
          setSubnets(subnetsData as Subnet[]);
        }
      } catch (err) {
        console.error("Error loading subnets:", err);
      }
    };
    loadSubnets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onSubmit({
        subnet: parseInt(subnet),
        name,
        description: description || null,
        start_ip: startIp,
        end_ip: endIp,
        reservation_policy: reservationPolicy,
        reserved_percentage: reservationPolicy === "percentage" ? parseFloat(reservedPercentage) : 0,
        reserved_count: reservationPolicy === "fixed" ? parseInt(reservedCount) : 0,
        is_active: isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save IP pool");
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="subnet">Subnet *</Label>
            <Select value={subnet} onValueChange={setSubnet} required>
              <SelectTrigger>
                <SelectValue placeholder="Select subnet" />
              </SelectTrigger>
              <SelectContent>
                {subnets.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.network} - {s.description || "No description"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Label htmlFor="reservation_policy">Reservation Policy *</Label>
            <Select
              value={reservationPolicy}
              onValueChange={(value) => setReservationPolicy(value as "none" | "percentage" | "fixed")}
              required
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reservationPolicy === "percentage" && (
            <div className="space-y-2">
              <Label htmlFor="reserved_percentage">Reserved Percentage *</Label>
              <Input
                id="reserved_percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={reservedPercentage}
                onChange={(e) => setReservedPercentage(e.target.value)}
                required
              />
            </div>
          )}

          {reservationPolicy === "fixed" && (
            <div className="space-y-2">
              <Label htmlFor="reserved_count">Reserved Count *</Label>
              <Input
                id="reserved_count"
                type="number"
                min="0"
                value={reservedCount}
                onChange={(e) => setReservedCount(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="start_ip">Start IP *</Label>
            <Input
              id="start_ip"
              type="text"
              value={startIp}
              onChange={(e) => setStartIp(e.target.value)}
              placeholder="192.168.1.10"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end_ip">End IP *</Label>
            <Input
              id="end_ip"
              type="text"
              value={endIp}
              onChange={(e) => setEndIp(e.target.value)}
              placeholder="192.168.1.254"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active
              </Label>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : pool ? "Update Pool" : "Create Pool"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
