"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { PermissionBundleRecord } from "@/types/groups"
import {
  idSchema,
  permissionBundleSchema,
  validateData,
} from "@/lib/security/validation-schemas"

export async function getPermissionBundle(
  id: number,
): Promise<PermissionBundleRecord | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to get permission bundle")
  }

  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    throw new Error("Invalid permission bundle ID")
  }

  const response = await serverApi.get<PermissionBundleRecord>(
    `/permission-bundles/${idValidation.data}/`,
  )
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? null
}

export async function listPermissionBundles(): Promise<PermissionBundleRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to list permission bundles")
  }

  const response = await serverApi.get<PermissionBundleRecord[]>(
    "/permission-bundles/",
  )
  if (response.error) {
    throw new Error(response.error)
  }

  const bundles = response.data
  if (Array.isArray(bundles)) {
    return bundles
  }

  if (
    bundles &&
    typeof bundles === "object" &&
    "results" in bundles &&
    Array.isArray((bundles as { results: PermissionBundleRecord[] }).results)
  ) {
    return (bundles as { results: PermissionBundleRecord[] }).results
  }

  console.warn("Unexpected permission bundles data format:", bundles)
  return []
}

export async function createPermissionBundle(
  payload: {
    name: string
    code: string
    app?: string | null
    description?: string | null
    permissionIds: number[]
  },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to create permission bundles" }
  }

  const normalized = {
    name: payload.name,
    code: payload.code,
    app: payload.app?.trim() ? payload.app.trim() : null,
    description: payload.description?.trim() ? payload.description.trim() : null,
    permissionIds: payload.permissionIds,
  }

  const validation = validateData(normalized, permissionBundleSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.post("/permission-bundles/", {
    name: validation.data.name,
    code: validation.data.code,
    app: validation.data.app,
    description: validation.data.description,
    permissions: validation.data.permissionIds,
  })

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to create permission bundle",
    }
  }

  return { success: true, message: "Permission bundle created successfully!" }
}

export async function updatePermissionBundle(
  id: number,
  payload: {
    name: string
    code: string
    app?: string | null
    description?: string | null
    permissionIds: number[]
  },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update permission bundles" }
  }

  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    return { success: false, error: "Invalid permission bundle ID" }
  }

  const normalized = {
    name: payload.name,
    code: payload.code,
    app: payload.app?.trim() ? payload.app.trim() : null,
    description: payload.description?.trim()
      ? payload.description.trim()
      : null,
    permissionIds: payload.permissionIds,
  }

  const validation = validateData(normalized, permissionBundleSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.put(`/permission-bundles/${idValidation.data}/`, {
    name: validation.data.name,
    code: validation.data.code,
    app: validation.data.app,
    description: validation.data.description,
    permissions: validation.data.permissionIds,
  })

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to update permission bundle",
    }
  }

  return { success: true, message: "Permission bundle updated successfully!" }
}

export async function deletePermissionBundle(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to delete permission bundles" }
  }

  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    return { success: false, error: "Invalid permission bundle ID" }
  }

  const response = await serverApi.delete(`/permission-bundles/${idValidation.data}/`)

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to delete permission bundle",
    }
  }

  return { success: true, message: "Permission bundle deleted successfully!" }
}

