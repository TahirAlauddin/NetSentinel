"use client";

import { useMemo } from "react";
import { SubnetMaskInfo } from "@/lib/ipam/subnet-mask-utils";
import { DataList, type ListColumn } from "@/components/common/DataList";

interface SubnetMaskTableProps {
  masks: SubnetMaskInfo[];
  loading?: boolean;
}

type MaskItem = SubnetMaskInfo & { id: number };

function formatNumber(num: number | string): string {
  if (typeof num === "string") return num;
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(2) + "K";
  return num.toLocaleString();
}

export function SubnetMaskTable({ masks, loading }: SubnetMaskTableProps) {
  const data: MaskItem[] = useMemo(
    () => masks.map((m) => ({ ...m, id: m.bitmask })),
    [masks]
  );

  const columns: ListColumn<MaskItem>[] = useMemo(
    () => [
      { key: "bitmask", header: "Bitmask", sortable: true, render: (m) => <span className="font-medium">/{m.bitmask}</span> },
      { key: "netmask", header: "Netmask", sortable: true, render: (m) => <span className="font-mono text-sm">{m.netmask}</span> },
      {
        key: "wildcard_mask",
        header: "Wildcard Mask",
        sortable: false,
        render: (m) => (
          <span className="font-mono text-sm">
            {m.wildcard_mask !== "Not applicable for IPv6" ? m.wildcard_mask : "-"}
          </span>
        ),
      },
      {
        key: "binary",
        header: "Binary",
        sortable: false,
        render: (m) => (
          <span className="font-mono text-xs text-muted-foreground" title={m.binary}>
            {m.binary.length > 50 ? `${m.binary.substring(0, 50)}...` : m.binary}
          </span>
        ),
      },
      { key: "subnets", header: "Subnets", sortable: true, render: (m) => formatNumber(m.subnets) },
      {
        key: "hosts",
        header: "Hosts",
        sortable: true,
        render: (m) => (typeof m.hosts === "number" ? formatNumber(m.hosts) : m.hosts),
      },
      { key: "subnet_bits", header: "Subnet Bits", sortable: false },
      { key: "host_bits", header: "Host Bits", sortable: false },
    ],
    []
  );

  return (
    <DataList<MaskItem>
      data={data}
      columns={columns}
      searchPlaceholder="Search by bitmask, netmask, or hosts..."
      searchKeys={["bitmask", "netmask", "wildcard_mask", "hosts", "subnets"]}
      searchable
      pagination
      paginationOptions={{ defaultPageSize: 25, pageSizeOptions: [10, 25, 50, 100] }}
      emptyMessage="No subnet masks found"
      loading={loading}
      loadingMessage="Loading subnet masks..."
      showViewToggle={false}
    />
  );
}
