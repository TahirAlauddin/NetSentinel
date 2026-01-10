"use client";

import { useState } from "react";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { IPSearch } from "@/components/ipam/ip-search";
import { IPImportDialog } from "@/components/ipam/ip-import-dialog";
import { IPExportDialog } from "@/components/ipam/ip-export-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, Download } from "lucide-react";
import type { IPAddress } from "@/types/ipam";
import { useRouter } from "next/navigation";

export default function SearchPage() {
  const router = useRouter();
  const [selectedIP, setSelectedIP] = useState<IPAddress | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const handleIPSelect = (ip: IPAddress) => {
    setSelectedIP(ip);
    // Could navigate to IP details page if it exists
    // router.push(`/ipam/ip-addresses/${ip.id}`);
  };

  return (
    <div className="space-y-6">
      <IpamHeader
        currentPage="IP Address Search"
      />
      <IpamNavTabs />

      {/* Import/Export Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import IPs
          </Button>
          <Button
            variant="outline"
            onClick={() => setExportDialogOpen(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export IPs
          </Button>
        </div>
      </div>

      <IPSearch onIPSelect={handleIPSelect} />

      {selectedIP && (
        <Card>
          <CardHeader>
            <CardTitle>IP Address Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">IP Address</div>
                <div className="font-mono text-lg">{selectedIP.address}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Status</div>
                <Badge>{selectedIP.status_display}</Badge>
              </div>
              {selectedIP.subnet_detail && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Subnet</div>
                  <div className="font-mono">{selectedIP.subnet_detail.network}</div>
                </div>
              )}
              {selectedIP.description && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div>{selectedIP.description}</div>
                </div>
              )}
              {selectedIP.assigned_to_asset_detail && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Assigned to Asset</div>
                  <div>{selectedIP.assigned_to_asset_detail.name}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import/Export Dialogs */}
      <IPImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={() => {
          // Optionally refresh search results
        }}
      />
      <IPExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
      />
    </div>
  );
}

