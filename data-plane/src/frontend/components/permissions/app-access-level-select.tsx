"use client";

import React, { useMemo, useState } from "react";
import {
  APP_LABELS,
  APP_ORDER,
  type AppKey,
} from "@/components/permissions/permissions-by-app.constants";

type AccessLevel = "none" | "read" | "edit" | "admin";

type AppAccessLevelSelectProps = {
  disabled?: boolean;
};

const MANAGED_APPS: AppKey[] = APP_ORDER.filter((x) => x !== "all");

type AppAccessSelections = Record<AppKey, AccessLevel>;

async function postAppAccessSelections(levels: AppAccessSelections): Promise<void> {
  await fetch("/api/dummy/app-level-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_access_levels: Object.entries(levels).map(([app, level]) => ({
        app,
        level,
      })),
    }),
  });
}

export default function AppLevelPermissionSelect({
  disabled,
}: AppAccessLevelSelectProps) {
  const initialSelections = useMemo(() => {
    const base = {} as AppAccessSelections;
    for (const app of MANAGED_APPS) {
      base[app] = "none";
    }
    return base;
  }, []);
  const [selections, setSelections] = useState<AppAccessSelections>(initialSelections);

  const applyLevelForApp = (app: AppKey, level: AccessLevel) => {
    const next = { ...selections, [app]: level };
    setSelections(next);
    void postAppAccessSelections(next).catch((error) => {
      console.warn("Dummy app-level access post failed:", error);
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border overflow-hidden">
        <div className="grid grid-cols-2 bg-[oklch(0.98_0_0)] px-3 py-2 text-xs font-medium">
          <span>NetSentinel App Access</span>
          <span>Permission level</span>
        </div>
        <div className="divide-y divide-border">
          {MANAGED_APPS.map((app) => (
            <div key={app} className="grid grid-cols-2 items-center gap-3 px-3 py-2">
              <span className="text-sm">{APP_LABELS[app]}</span>
              <select
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={selections[app] ?? "none"}
                disabled={disabled}
                onChange={(e) => applyLevelForApp(app, e.target.value as AccessLevel)}
              >
                <option value="none">None</option>
                <option value="read">Read All</option>
                <option value="edit">Edit All</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

