"use client";

import React from "react";
import {
  APP_LABELS,
  APP_ORDER,
  type AccessLevel,
  type AppAccessSelection,
  type AppKey,
} from "@/constants/permissions-by-app";

export type { AppAccessSelection, AccessLevel };

type AppAccessLevelSelectProps = {
  value: AppAccessSelection;
  onChange: (levels: AppAccessSelection) => void;
  disabled?: boolean;
};

const MANAGED_APPS = APP_ORDER.filter((x): x is Exclude<AppKey, "all"> => x !== "all");

/**
 * Controlled app-level permission picker.
 * Parent owns state and receives updated per-app access levels on change.
 */
export default function AppLevelPermission({
  value,
  onChange,
  disabled,
}: AppAccessLevelSelectProps) {
  const applyLevelForApp = (app: Exclude<AppKey, "all">, level: AccessLevel) => {
    onChange({ ...value, [app]: level });
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
                value={value[app]}
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
