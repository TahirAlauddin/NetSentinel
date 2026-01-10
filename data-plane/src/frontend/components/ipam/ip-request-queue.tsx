"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import type { IPRequest } from "@/types/ipam";

interface IPRequestQueueProps {
  requests: IPRequest[];
  onApprove: (id: number, notes?: string) => Promise<void>;
  onReject: (id: number, notes?: string) => Promise<void>;
  loading?: boolean;
}

export function IPRequestQueue({
  requests,
  onApprove,
  onReject,
  loading = false,
}: IPRequestQueueProps) {
  const [selectedRequest, setSelectedRequest] = useState<IPRequest | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleAction = async () => {
    if (!selectedRequest || !action) return;

    setProcessing(true);
    try {
      if (action === "approve") {
        await onApprove(selectedRequest.id, notes || undefined);
      } else {
        await onReject(selectedRequest.id, notes || undefined);
      }
      setSelectedRequest(null);
      setAction(null);
      setNotes("");
    } catch (error) {
      console.error("Error processing request:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (request: IPRequest) => {
    const statusConfig = {
      pending: { variant: "outline" as const, icon: Clock, label: "Pending" },
      approved: { variant: "default" as const, icon: CheckCircle2, label: "Approved" },
      rejected: { variant: "destructive" as const, icon: XCircle, label: "Rejected" },
      expired: { variant: "outline" as const, icon: AlertCircle, label: "Expired" },
      completed: { variant: "default" as const, icon: CheckCircle2, label: "Completed" },
    };

    const config = statusConfig[request.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">IP Request Queue</h3>
        <Badge variant="outline">{pendingRequests.length} Pending</Badge>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No IP requests found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="hover:bg-accent/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {request.requested_ip || "Auto-assign"}
                      </span>
                      {getStatusBadge(request)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div>
                        <strong>Subnet:</strong> {request.subnet_detail?.network || `#${request.subnet}`}
                      </div>
                      <div>
                        <strong>Requested by:</strong>{" "}
                        {request.requested_by_detail?.full_name || request.requested_by_detail?.username || `User #${request.requested_by}`}
                      </div>
                      <div>
                        <strong>Purpose:</strong> {request.purpose}
                      </div>
                      {request.description && (
                        <div>
                          <strong>Description:</strong> {request.description}
                        </div>
                      )}
                      <div className="text-xs mt-1">
                        Requested: {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAction("reject");
                          setNotes("");
                        }}
                        disabled={loading}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setAction("approve");
                          setNotes("");
                        }}
                        disabled={loading}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval/Rejection Dialog */}
      <Dialog
        open={selectedRequest !== null && action !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setAction(null);
            setNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "approve" ? "Approve IP Request" : "Reject IP Request"}
            </DialogTitle>
            <DialogDescription>
              {action === "approve"
                ? "This will create/reserve the IP address and mark the request as completed."
                : "This will mark the request as rejected."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md space-y-1 text-sm">
                <div>
                  <strong>IP:</strong> {selectedRequest.requested_ip || "Auto-assign"}
                </div>
                <div>
                  <strong>Subnet:</strong> {selectedRequest.subnet_detail?.network}
                </div>
                <div>
                  <strong>Purpose:</strong> {selectedRequest.purpose}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">
                  {action === "approve" ? "Approval" : "Rejection"} Notes (optional)
                </Label>
                <Textarea
                  id="approval-notes"
                  placeholder={`Add notes for this ${action === "approve" ? "approval" : "rejection"}...`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null);
                    setAction(null);
                    setNotes("");
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant={action === "approve" ? "default" : "destructive"}
                  onClick={handleAction}
                  disabled={processing}
                >
                  {processing
                    ? "Processing..."
                    : action === "approve"
                      ? "Approve Request"
                      : "Reject Request"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
