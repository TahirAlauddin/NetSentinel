"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Search, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { Subnet } from "@/types/ipam";

interface SubnetTreeNode {
  id: number;
  network: string;
  description?: string | null;
  children?: SubnetTreeNode[];
  hasChildren?: boolean;
}

interface SubnetTreeProps {
  subnets: Subnet[];
  selectedSubnetId?: number;
  onSubnetSelect?: (subnetId: number) => void;
}

/**
 * SubnetTree component
 * Displays a hierarchical tree view of subnets in the sidebar
 */
export function SubnetTree({ subnets, selectedSubnetId, onSubnetSelect }: SubnetTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  // Build tree structure from flat subnet list
  const buildTree = (subnets: Subnet[]): SubnetTreeNode[] => {
    const subnetMap = new Map<number, SubnetTreeNode>();
    const rootNodes: SubnetTreeNode[] = [];

    // First pass: create all nodes
    subnets.forEach((subnet) => {
      subnetMap.set(subnet.id, {
        id: subnet.id,
        network: subnet.network,
        description: subnet.description,
        children: [],
        hasChildren: false,
      });
    });

    // Second pass: build parent-child relationships
    subnets.forEach((subnet) => {
      const node = subnetMap.get(subnet.id)!;
      if (subnet.master_subnet && subnetMap.has(subnet.master_subnet)) {
        const parent = subnetMap.get(subnet.master_subnet)!;
        parent.children = parent.children || [];
        parent.children.push(node);
        parent.hasChildren = true;
      } else {
        rootNodes.push(node);
      }
    });

    return rootNodes;
  };

  const treeNodes = buildTree(subnets);

  const toggleNode = (nodeId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: SubnetTreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedSubnetId === node.id;
    const hasChildren = node.hasChildren || (node.children && node.children.length > 0);

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded-md text-sm cursor-pointer hover:bg-[oklch(0.93_0_0)] transition-colors",
            isSelected && "bg-[oklch(0.93_0_0)] text-[oklch(0.40_0.15_249)] font-medium"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            }
            onSubnetSelect?.(node.id);
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-0.5 hover:bg-[oklch(0.88_0_0)] rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Folder className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="flex-1 truncate" title={node.network}>
            {node.network}
          </span>
        </div>
        {isExpanded && hasChildren && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">Available subnets</h3>
        <div className="flex items-center gap-1">
          <button
            className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
            title="Add subnet"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
            title="Search"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            className="p-1 hover:bg-[oklch(0.93_0_0)] rounded"
            title="Find subnet"
          >
            <QrCode className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
        {treeNodes.length === 0 ? (
          <div className="text-sm text-muted-foreground px-2 py-4 text-center">
            No subnets available
          </div>
        ) : (
          treeNodes.map((node) => renderNode(node))
        )}
      </div>
    </div>
  );
}

