"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { PermissionRecord } from "@/types/groups"

type PaginatedPermissions = {
  count?: number
  next: string | null
  previous?: string | null
  results: PermissionRecord[]
}

////////////////////////////////////////////////////////////
// Permissions
////////////////////////////////////////////////////////////
export async function listPermissionsPage(
  page: number,
): Promise<{
  results: PermissionRecord[]
  hasMore: boolean
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to list permissions")
  }

  const response = await serverApi.get<PaginatedPermissions | PermissionRecord[]>(
    `/permissions/?page=${page}`,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  const data = response.data

  if (Array.isArray(data)) {
    return { results: data, hasMore: false }
  }

  if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
    return {
      results: data.results,
      hasMore: Boolean(data.next),
    }
  }

  console.warn("Unexpected permissions data format:", data)
  return { results: [], hasMore: false }
}

export async function searchPermissionsPage(
  query: string,
  page: number,
): Promise<{
  results: PermissionRecord[]
  hasMore: boolean
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to list permissions")
  }

  const search = query.trim()
  if (!search) {
    return { results: [], hasMore: false }
  }

  const response = await serverApi.get<PaginatedPermissions | PermissionRecord[]>(
    `/permissions/?search=${encodeURIComponent(search)}&page=${page}`,
  )

  if (response.error) {
    throw new Error(response.error)
  }

  const data = response.data

  if (Array.isArray(data)) {
    return { results: data, hasMore: false }
  }

  if (
    data &&
    typeof data === "object" &&
    "results" in data &&
    Array.isArray((data as { results: PermissionRecord[] }).results)
  ) {
    return {
      results: (data as { results: PermissionRecord[] }).results,
      hasMore: Boolean((data as { next?: string | null }).next),
    }
  }

  console.warn("Unexpected permissions data format:", data)
  return { results: [], hasMore: false }
}

/** First page only; same as `listPermissionsPage(1).results`. */
export async function listPermissions(): Promise<PermissionRecord[]> {
  const { results } = await listPermissionsPage(1)
  return results
}

