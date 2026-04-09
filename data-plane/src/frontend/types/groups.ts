export interface PermissionRecord {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

export interface GroupRecord {
  id: number;
  name: string;
  permissions: number[]; // Permission IDs (always present)
  /** IDs of PermissionBundle rows attached via ExtendedGroup (Layer 3). */
  permission_bundle_ids?: number[];
  /** UI-level count with users-family collapsed to a single app. */
  app_level_permission_count?: number;
  user_count?: number;
}

export interface PermissionBundleRecord {
  id: number;
  name: string;
  code: string;
  app?: string | null;
  description?: string | null;
  permissions: number[]; // Permission IDs (always present)
}

