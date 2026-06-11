"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, MessageSquare, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SeverityBadge } from "./severity-badge";
import type { Problem } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

interface ProblemsTableProps {
  problems: Problem[];
  onRefresh: () => void;
  canAcknowledge?: boolean;
}

export function ProblemsTable({ problems, onRefresh, canAcknowledge = true }: ProblemsTableProps) {
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [ackMessage, setAckMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const openAck = (p: Problem) => {
    setSelectedProblem(p);
    setAckMessage("");
    setAckDialogOpen(true);
  };

  const handleAcknowledge = async () => {
    if (!selectedProblem) return;
    setLoading(true);
    const res = await api.acknowledgeProblem(selectedProblem.id, ackMessage);
    setLoading(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Problem acknowledged.");
      setAckDialogOpen(false);
      onRefresh();
    }
  };

  const handleResolve = async (id: number) => {
    if (!confirm("Mark this problem as resolved?")) return;
    const res = await api.resolveProblem(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Problem resolved.");
      onRefresh();
    }
  };

  if (problems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <CheckCircle2 className="h-12 w-12 text-green-400 opacity-60" />
        <p className="text-sm font-medium">No active problems — all clear!</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Problem</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Ack</TableHead>
            <TableHead>Status</TableHead>
            {canAcknowledge && <TableHead className="w-[120px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems.map((p) => (
            <TableRow
              key={p.id}
              className={p.status === "resolved" ? "opacity-60" : undefined}
            >
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(p.clock), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <SeverityBadge severity={p.severity} />
              </TableCell>
              <TableCell className="font-medium text-sm">
                {p.host_name ?? "—"}
              </TableCell>
              <TableCell className="text-sm max-w-[280px] truncate">{p.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.duration}</TableCell>
              <TableCell>
                {p.acknowledged ? (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Yes
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">No</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={p.status === "active" ? "destructive" : "secondary"}
                  className="text-xs"
                >
                  {p.status_display}
                </Badge>
              </TableCell>
              {canAcknowledge && (
                <TableCell>
                  <div className="flex gap-1">
                    {!p.acknowledged && p.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => openAck(p)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" /> Ack
                      </Button>
                    )}
                    {p.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-green-600 hover:text-green-700"
                        onClick={() => handleResolve(p.id)}
                      >
                        <X className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={ackDialogOpen} onOpenChange={setAckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Acknowledge Problem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{selectedProblem?.host_name}</span>:{" "}
              {selectedProblem?.name}
            </p>
            <Textarea
              placeholder="Optional message (visible to team)…"
              value={ackMessage}
              onChange={(e) => setAckMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAckDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAcknowledge} disabled={loading}>
              {loading ? "Acknowledging…" : "Acknowledge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
