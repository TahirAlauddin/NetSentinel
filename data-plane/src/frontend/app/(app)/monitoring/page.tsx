"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Server,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  FileCode2,
  BarChart2,
  Zap,
  Calendar,
  TrendingUp,
  TrendingDown,
  Plus,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonitoringHeader } from "@/components/apps/monitoring/monitoring-header";
import { SeverityBadge } from "@/components/apps/monitoring/severity-badge";
import { AvailabilityBadge } from "@/components/apps/monitoring/availability-badge";
import type { MonitoringStats, Problem, TriggerSeverity } from "@/types/monitoring";
import { MonitoringApiClient } from "@/lib/api-client/monitoring";

const api = new MonitoringApiClient();

const SEVERITY_ORDER: TriggerSeverity[] = [
  "disaster",
  "high",
  "average",
  "warning",
  "information",
  "not_classified",
];

export default function MonitoringOverviewPage() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [recentProblems, setRecentProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [statsRes, problemsRes] = await Promise.all([
        api.getStats(),
        api.getProblems({ status: "active" }),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (problemsRes.data) {
        const data = Array.isArray(problemsRes.data) ? problemsRes.data : [];
        setRecentProblems(data.slice(0, 8));
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <MonitoringHeader currentPage="Overview" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <MonitoringHeader currentPage="Overview" />
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
          Unable to connect to Zabbix. Check that{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            ZABBIX_URL
          </code>{" "}
          and{" "}
          <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
            ZABBIX_TOKEN
          </code>{" "}
          are configured in the backend.
        </div>
      </div>
    );
  }

  const hasProblems = stats.problems.total_active > 0;

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <MonitoringHeader currentPage="Overview" />
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/monitoring/dashboard">
              <BarChart2 className="h-3.5 w-3.5 mr-1.5" />
              Dashboard
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/monitoring/hosts/add">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Host
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Top-level summary ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Hosts"
          value={stats.hosts.total}
          sub={`${stats.hosts.monitored} monitored`}
          icon={Server}
          href="/monitoring/hosts"
        />
        <SummaryCard
          label="Active Problems"
          value={stats.problems.total_active}
          sub={
            stats.problems.unacknowledged > 0
              ? `${stats.problems.unacknowledged} unacked`
              : "All acknowledged"
          }
          icon={AlertTriangle}
          href="/monitoring/problems"
          variant={hasProblems ? "danger" : "success"}
        />
        <SummaryCard
          label="Available"
          value={stats.hosts.available}
          sub={
            stats.hosts.unavailable > 0
              ? `${stats.hosts.unavailable} unavailable`
              : "None unavailable"
          }
          icon={CheckCircle2}
          href="/monitoring/hosts?availability=available"
          variant={stats.hosts.unavailable > 0 ? "warning" : "success"}
        />
        <SummaryCard
          label="Items Enabled"
          value={stats.items}
          sub={`${stats.triggers.in_problem} triggers firing`}
          icon={BarChart2}
          href="/monitoring/items"
        />
      </div>

      {/* ── Problems by severity ── */}
      <section className="space-y-3">
        <SectionLabel
          label="Problems by Severity"
          href="/monitoring/problems"
          count={stats.problems.total_active}
        />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SEVERITY_ORDER.map((sev) => {
            const count = stats.problems.by_severity[sev] ?? 0;
            return (
              <Link
                key={sev}
                href={`/monitoring/problems?severity=${sev}`}
                className="group"
              >
                <Card className="text-center py-3 px-2 hover:shadow-sm transition-shadow cursor-pointer group-hover:border-primary/30">
                  <CardContent className="p-0 space-y-1">
                    <p className="text-2xl font-bold">{count}</p>
                    <SeverityBadge severity={sev} showDot={false} />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Host availability ── */}
      <section className="space-y-3">
        <SectionLabel
          label="Host Availability"
          href="/monitoring/hosts"
          count={stats.hosts.total}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard
            label="Available"
            value={stats.hosts.available}
            href="/monitoring/hosts?availability=available"
            badge={<AvailabilityBadge availability="available" />}
          />
          <MetricCard
            label="Unavailable"
            value={stats.hosts.unavailable}
            href="/monitoring/hosts?availability=unavailable"
            badge={<AvailabilityBadge availability="unavailable" />}
            highlight={stats.hosts.unavailable > 0}
          />
          <MetricCard
            label="Unknown"
            value={stats.hosts.unknown}
            href="/monitoring/hosts?availability=unknown"
            badge={<AvailabilityBadge availability="unknown" />}
          />
          <MetricCard
            label="Not Monitored"
            value={stats.hosts.not_monitored}
            href="/monitoring/hosts?status=unmonitored"
            icon={TrendingDown}
          />
        </div>
      </section>

      {/* ── Config at a glance ── */}
      <section className="space-y-3">
        <SectionLabel label="Configuration" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <MetricCard label="Host Groups" value={stats.host_groups} href="/monitoring/hosts" icon={FolderOpen} />
          <MetricCard label="Templates" value={stats.templates} href="/monitoring/templates" icon={FileCode2} />
          <MetricCard label="Triggers Total" value={stats.triggers.total} href="/monitoring/triggers" icon={Zap} />
          <MetricCard label="Triggers Enabled" value={stats.triggers.enabled} href="/monitoring/triggers" icon={TrendingUp} />
          <MetricCard
            label="Active Maintenance"
            value={stats.active_maintenance}
            href="/monitoring/maintenance"
            icon={Calendar}
            highlight={stats.active_maintenance > 0}
          />
        </div>
      </section>

      {/* ── Recent problems ── */}
      {recentProblems.length > 0 && (
        <section className="space-y-3">
          <SectionLabel
            label="Recent Active Problems"
            href="/monitoring/problems"
            count={recentProblems.length}
          />
          <Card>
            <CardContent className="p-0">
                {recentProblems.map((p, i) => (
                  <div key={p.id}>
                    {i > 0 && <div className="h-px bg-border" />}
                  <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <SeverityBadge severity={p.severity} className="shrink-0" />
                    <span className="font-medium text-sm flex-1 truncate">
                      {p.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {p.host_name}
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0 min-w-[4rem] text-right">
                      {p.duration}
                    </span>
                    {!p.acknowledged && (
                      <Badge
                        variant="outline"
                        className="text-xs shrink-0 border-orange-300 text-orange-700 bg-orange-50"
                      >
                        Unacked
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

/* ─── Helper sub-components ─────────────────────────────────────────────── */

interface SectionLabelProps {
  label: string;
  href?: string;
  count?: number;
}

function SectionLabel({ label, href, count }: SectionLabelProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </h2>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground font-normal">
            ({count})
          </span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant?: "default" | "success" | "danger" | "warning";
}

function SummaryCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  variant = "default",
}: SummaryCardProps) {
  const valueColor = {
    default: "text-foreground",
    success: "text-green-600",
    danger: "text-red-600",
    warning: "text-yellow-600",
  }[variant];

  const iconBg = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-50 text-green-600",
    danger: "bg-red-50 text-red-600",
    warning: "bg-yellow-50 text-yellow-600",
  }[variant];

  return (
    <Link href={href}>
      <Card className="hover:shadow-sm hover:border-primary/30 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${iconBg}`}
            >
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <p className={`text-3xl font-bold tabular-nums ${valueColor}`}>
            {value}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  highlight?: boolean;
}

function MetricCard({
  label,
  value,
  href,
  icon: Icon,
  badge,
  highlight,
}: MetricCardProps) {
  const inner = (
    <Card
      className={`transition-all ${href ? "hover:shadow-sm hover:border-primary/30 cursor-pointer" : ""} ${highlight ? "border-orange-200 bg-orange-50/30" : ""}`}
    >
      <CardContent className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xl font-bold tabular-nums ${highlight ? "text-orange-700" : ""}`}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        <div className="shrink-0">
          {badge ?? (Icon && (
            <Icon
              className={`h-5 w-5 ${highlight ? "text-orange-400" : "text-muted-foreground/40"}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}
