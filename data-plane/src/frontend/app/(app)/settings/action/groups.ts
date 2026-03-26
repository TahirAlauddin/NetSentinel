"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { GroupRecord } from "@/types/groups"
import { groupSchema, idSchema, validateData } from "@/lib/security/validation-schemas"

export async function getGroup(id: number): Promise<GroupRecord | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to get group")
  }

  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    throw new Error("Invalid group ID")
  }

  const response = await serverApi.get<GroupRecord>(
    `/groups/${idValidation.data}/`,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? null
}

export async function listGroups(): Promise<GroupRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to list groups")
  }

  const response = await serverApi.get<GroupRecord[]>("/groups/")
  if (response.error) {
    throw new Error(response.error)
  }

  const groups = response.data

  if (Array.isArray(groups)) {
    return groups
  }

  if (
    groups &&
    typeof groups === "object" &&
    "results" in groups &&
    Array.isArray((groups as { results: GroupRecord[] }).results)
  ) {
    return (groups as { results: GroupRecord[] }).results
  }

  console.warn("Unexpected groups data format:", groups)
  return []
}

export async function createGroup(
  name: string,
  permissionIds: number[],
  permissionBundleIds: number[],
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to create groups" }
  }

  const validation = validateData(
    { name, permissionIds, permissionBundleIds },
    groupSchema,
  )
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.post("/groups/", {
    name: validation.data.name,
    permissions: validation.data.permissionIds,
    permission_bundle_ids: validation.data.permissionBundleIds,
  })

  if (response.error) {
    return { success: false, error: response.error || "Failed to create group" }
  }

  return { success: true, message: "Group created successfully!" }
}

export async function updateGroup(
  id: number,
  name: string,
  permissionIds: number[],
  permissionBundleIds: number[],
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update groups" }
  }

  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    return { success: false, error: "Invalid group ID" }
  }

  const validation = validateData(
    { name, permissionIds, permissionBundleIds },
    groupSchema,
  )
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.put(`/groups/${idValidation.data}/`, {
    name: validation.data.name,
    permissions: validation.data.permissionIds,
    permission_bundle_ids: validation.data.permissionBundleIds,
  })

  if (response.error) {
    return { success: false, error: response.error || "Failed to update group" }
  }

  return { success: true, message: "Group updated successfully!" }
}

export async function deleteGroup(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to delete groups" }
  }

  const validation = validateData(id, idSchema)
  if (!validation.success) {
    return { success: false, error: "Invalid group ID" }
  }

  const response = await serverApi.delete(`/groups/${validation.data}/`)

  if (response.error) {
    return { success: false, error: response.error || "Failed to delete group" }
  }

  return { success: true, message: "Group deleted successfully!" }
}

