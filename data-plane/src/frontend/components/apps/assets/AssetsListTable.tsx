"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { Asset } from "@/types/assets";
import {
  getWarrantyColor,
  formatWarrantyStatus,
  calculateWarrantyStatus,
} from "@/components/apps/assets/utils";

export interface AssetsListTableProps {
  assets: Asset[];
  loading: boolean;
  onEdit: (asset: Asset) => void;
  onView: (asset: Asset) => void;
  onDelete: (id: number) => void;
}

/**
 * Table view for the assets list page: type, name, source, tags, warranty status, actions.
 */
export function AssetsListTable({
  assets,
  loading,
  onEdit,
  onView,
  onDelete,
}: AssetsListTableProps) {
  if (loading) {
    return (
      <Card>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading assets...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input type="checkbox" className="rounded" />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Asset Name</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Warranty Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => {
                const warrantyStatus = asset.warranty_expiration
                  ? calculateWarrantyStatus(asset.warranty_expiration)
                  : "no_warranty";

                return (
                  <TableRow key={asset.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded" />
                    </TableCell>
                    <TableCell>
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                        <span className="text-xs">•</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <div className="w-4 h-4 rounded bg-primary/20 cursor-pointer hover:bg-primary/30" />
                    </TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                    <TableCell>
                      {asset.warranty_expiration ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: getWarrantyColor(warrantyStatus),
                            }}
                          />
                          <span className="text-sm">
                            {formatWarrantyStatus(warrantyStatus)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            No warranty info
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(asset)}
                          className="gap-1"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(asset)}
                          className="gap-1"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(asset.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
