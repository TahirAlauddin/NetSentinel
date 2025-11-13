export interface PermissionRecord {
  id: number;
  name: string;
  codename: string;
  content_type: number;
}

export interface GroupRecord {
  id: number;
  name: string;
  permissions: number[]; // Permission IDs
  permissions_detail?: PermissionRecord[];
  user_count?: number;
}

