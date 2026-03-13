"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTelecomOverview } from "@/hooks/useTelecomOverview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Zap, Building2, Cable } from "lucide-react";

const COLORS = ["#2E7CF6", "#16A085", "#8B6FD9"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function TelecomOverview() {
  const { kpis } = useTelecomOverview();
  const donutData = useMemo(
    () => [
      { name: "Data", value: kpis.byCategory.data },
      { name: "Voice", value: kpis.byCategory.voice },
      { name: "Consolidated", value: kpis.byCategory.consolidated },
    ],
    [kpis.byCategory.data, kpis.byCategory.voice, kpis.byCategory.consolidated]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Telecom Expense Management</h1>
        <p className="text-muted-foreground mt-1">
          Track and manage your telecom expenses, providers, and services.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/telecom-management/providers" className="gap-2">
            <Building2 className="w-4 h-4" />
            Providers
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/telecom-management/services" className="gap-2">
            <Zap className="w-4 h-4" />
            Services
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/telecom-management/phone-numbers" className="gap-2">
            <Phone className="w-4 h-4" />
            Phone Numbers
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/telecom-management/data-circuits" className="gap-2">
            <Cable className="w-4 h-4" />
            Data Circuits
          </Link>
        </Button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">At a glance</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <Card>
            <CardContent className="px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                IP Addresses
              </p>
              <p className="text-3xl font-semibold leading-tight mt-1">
                {kpis.ipAddressCount}
              </p>
            </CardContent>
          </Card>
          <Card className="transition-colors hover:bg-muted/50">
            <Link href="/telecom-management/phone-numbers">
              <CardContent className="px-3 py-3 cursor-pointer">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Phone Numbers
                </p>
                <p className="text-3xl font-semibold leading-tight mt-1">
                  {kpis.phoneNumberCount}
                </p>
                <p className="text-xs text-primary mt-1">View all →</p>
              </CardContent>
            </Link>
          </Card>
          <Card>
            <CardContent className="px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Voice
              </p>
              <p className="text-xl font-semibold leading-tight mt-1">
                {formatCurrency(kpis.voiceMonthly)}
              </p>
              <p className="text-[11px] text-muted-foreground">/month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Data
              </p>
              <p className="text-xl font-semibold leading-tight mt-1">
                {formatCurrency(kpis.dataMonthly)}
              </p>
              <p className="text-[11px] text-muted-foreground">/month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-3 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Consolidated
              </p>
              <p className="text-xl font-semibold leading-tight mt-1">
                {formatCurrency(kpis.consolidatedMonthly)}
              </p>
              <p className="text-[11px] text-muted-foreground">/month</p>
            </CardContent>
          </Card>
          <Card className="transition-colors hover:bg-muted/50">
            <Link href="/telecom-management/data-circuits">
              <CardContent className="px-3 py-3 cursor-pointer">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Data Circuits
                </p>
                <p className="text-xl font-semibold leading-tight mt-1 text-muted-foreground">
                  —
                </p>
                <p className="text-xs text-primary mt-1">View all →</p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Placeholder for a future chart extraction; keep donut logic nearby for now */}
        <Card className="mt-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Service Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="w-full lg:w-[320px] h-[220px]">
                {/* Donut chart is rendered in the services overview for now */}
                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                  Distribution chart rendered with services overview
                </div>
              </div>
              <div className="w-full">
                <p className="text-2xl font-bold">{kpis.totalServices}</p>
                <p className="text-sm text-muted-foreground mb-3">
                  Total active services
                </p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {donutData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md border px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-sm">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {item.name}
                      </span>
                      <span className="font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

