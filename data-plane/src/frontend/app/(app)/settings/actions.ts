"use server";

// Backward-compatible facade:
// `app/(app)/settings/action/*` now owns implementation.
// Keep this file as a thin re-export layer so existing imports continue to work.
export * from "./action/users";
export * from "./action/permissions";
export * from "./action/groups";
export * from "./action/permission-bundles";
