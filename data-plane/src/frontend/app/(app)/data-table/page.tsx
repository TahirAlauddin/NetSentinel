"use client";

import React from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import DataList, { type ListColumn, type ListGridItem } from "@/components/common/DataList";

/** Example item type – replace with your domain type (e.g. Subnet, Device, Customer) */
interface SampleItem {
  id: string;
  subnet: string;
  description: string;
  vlan: string;
  vrf: string;
}

const sampleData: SampleItem[] = [
  { id: "1", subnet: "10.0.1.0/24", description: "Core network", vlan: "1", vrf: "default" },
  { id: "2", subnet: "10.0.2.0/24", description: "Guest Wi-Fi", vlan: "2", vrf: "guest" },
  { id: "3", subnet: "10.0.3.0/24", description: "IoT segment", vlan: "3", vrf: "default" },
  { id: "4", subnet: "192.168.1.0/24", description: "Office", vlan: "10", vrf: "corp" },
  { id: "5", subnet: "192.168.2.0/24", description: "DMZ", vlan: "20", vrf: "dmz" },
  { id: "6", subnet: "172.16.0.0/16", description: "Backup", vlan: "99", vrf: "default" },
];

const columns: ListColumn<SampleItem>[] = [
  { key: "subnet", header: "Subnet", sortable: true },
  { key: "description", header: "Description", sortable: true },
  { key: "vlan", header: "VLAN", sortable: true },
  { key: "vrf", header: "VRF", sortable: true },
];

const gridItems: ListGridItem<SampleItem>[] = [
  { key: "subnet", label: "Subnet", render: (item) => <span className="font-mono font-medium">{item.subnet}</span> },
  { key: "description", label: "Description", render: (item) => item.description },
  { key: "details", render: (item) => (
    <div className="text-xs text-muted-foreground space-y-1">
      <div>VLAN: {item.vlan}</div>
      <div>VRF: {item.vrf}</div>
    </div>
  ) },
];

export default function TestListPage() {
  return (
    <div className="container py-6">
      <DataList<SampleItem>
        data={sampleData}
        columns={columns}
        gridItems={gridItems}
        title="Subnets"
        searchPlaceholder="Search subnets..."
        searchKeys={["subnet", "description", "vlan", "vrf"]}
        searchable
        pagination
        paginationOptions={{ pageSizeOptions: [5, 10, 25], defaultPageSize: 5 }}
        emptyMessage="No subnets found"
        initialViewMode="list"
        gridColumns={3}
        headerActions={
          <>
            <Button className="gap-2 bg-[oklch(0.40_0.15_249)] hover:bg-[oklch(0.35_0.15_249)]">
              <Plus className="w-4 h-4" />
              Add subnet
            </Button>
            <Button variant="outline" className="gap-2">
              <Search className="w-4 h-4" />
              Find subnet
            </Button>
          </>
        }
      />
    </div>
  );
}
