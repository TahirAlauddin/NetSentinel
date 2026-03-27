
// Backward-compatible facade:
// `app/(app)/settings/action/*` now owns implementation.
// Keep this file as a thin re-export layer so existing imports continue to work.
export * from "./actions/users";
export * from "./actions/permissions";
export * from "./actions/groups";
export * from "./actions/permission-bundles";
