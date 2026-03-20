"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { UserRecord } from "@/types/users"
import { GroupRecord, PermissionRecord } from "@/types/groups"
import {
  createUserSchema,
  groupSchema,
  idSchema,
  parseFormData,
  validateData,
} from "@/lib/security/validation-schemas"

export async function listUsers(): Promise<UserRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error('Not authorized to list users')
  }

  const response = await serverApi.get<UserRecord[]>('/auth/users/')
  
  if (response.error) {
    throw new Error(response.error)
  }

  const users = response.data
  
  // Handle different response formats
  if (Array.isArray(users)) {
    return users
  }
  
  // Handle paginated response (if the API returns { results: [...] })
  if (users && typeof users === 'object' && 'results' in users && Array.isArray((users as { results: UserRecord[] }).results)) {
    return (users as { results: UserRecord[] }).results
  }
  
  // If no valid data format, return empty array
  console.warn('Unexpected users data format:', users)
  return []
}

export async function addUser(formData: FormData) {
  // Check authentication inside the action
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create users' }
  }

  // Validate inputs with Zod - never trust form data
  const validation = parseFormData(formData, createUserSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const { username, email, password, re_password, first_name, last_name } = validation.data

  const response = await serverApi.post('/auth/users/', {
    username,
    email,
    password,
    re_password,
    first_name: first_name || username,
    last_name: last_name || '',
  })

  if (response.error) {
    return { success: false, error: response.error || 'Failed to create user. Please try again.' }
  }

  const createdUserId =
    response.data && typeof response.data === "object" && "id" in response.data
      ? (response.data as { id: number | string }).id
      : null

  // Ensure a newly-created user starts permissionless.
  // (Djoser creates users with no groups/user_permissions by default, but this makes it explicit.)
  if (createdUserId) {
    await serverApi.put(`/users/${createdUserId}/assignments/`, {
      group_ids: [],
      permission_ids: [],
    })
  }

  return { success: true, message: 'User created successfully!', userId: createdUserId }
}

export async function getUser(userId: number): Promise<UserRecord | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to get user")
  }

  const response = await serverApi.get<UserRecord>(`/auth/users/${userId}/`)
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? null
}

export async function deleteUser(userId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to delete users" }
  }

  const response = await serverApi.delete(`/auth/users/${userId}/`)
  if (response.error) {
    return { success: false, error: response.error || "Failed to delete user" }
  }

  return { success: true, message: "User deleted successfully!" }
}

export type UserAssignments = {
  group_ids: number[]
  permission_ids: number[]
}

export async function getUserAssignments(userId: number): Promise<UserAssignments> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to get user assignments")
  }

  const response = await serverApi.get<UserAssignments>(`/users/${userId}/assignments/`)
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? { group_ids: [], permission_ids: [] }
}

export async function updateUserAssignments(
  userId: number,
  groupIds: number[],
  permissionIds: number[]
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update user assignments" }
  }

  const response = await serverApi.put(`/users/${userId}/assignments/`, {
    group_ids: groupIds,
    permission_ids: permissionIds,
  })

  if (response.error) {
    return { success: false, error: response.error || "Failed to update user assignments" }
  }

  return { success: true, message: "User assignments updated successfully!" }
}

export async function updateUserBasic(
  userId: number,
  payload: {
    username: string
    email: string
    first_name?: string
    last_name?: string
  }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update users" }
  }

  const user = await getUser(userId)
  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Djoser user update uses the full user serializer, so we keep role flags unchanged.
  const response = await serverApi.put(`/auth/users/${userId}/`, {
    username: payload.username,
    email: payload.email,
    first_name: payload.first_name ?? "",
    last_name: payload.last_name ?? "",
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
    is_active: user.is_active,
  })

  if (response.error) {
    return { success: false, error: response.error || "Failed to update user" }
  }

  return { success: true, message: "User updated successfully!" }
}

export async function listGroups(): Promise<GroupRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error('Not authorized to list groups')
  }

  const response = await serverApi.get<GroupRecord[]>('/groups/')
  
  if (response.error) {
    throw new Error(response.error)
  }

  const groups = response.data
  
  // Handle different response formats
  if (Array.isArray(groups)) {
    return groups
  }
  
  // Handle paginated response
  if (groups && typeof groups === 'object' && 'results' in groups && Array.isArray((groups as { results: GroupRecord[] }).results)) {
    return (groups as { results: GroupRecord[] }).results
  }
  
  console.warn('Unexpected groups data format:', groups)
  return []
}

type PaginatedPermissions = {
  count?: number
  next: string | null
  previous?: string | null
  results: PermissionRecord[]
}

/**
 * One page of permissions (DRF PageNumberPagination). Use page=1 initially, then increment while hasMore.
 */
export async function listPermissionsPage(page: number): Promise<{
  results: PermissionRecord[]
  hasMore: boolean
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error('Not authorized to list permissions')
  }

  const response = await serverApi.get<PaginatedPermissions | PermissionRecord[]>(
    `/permissions/?page=${page}`
  )

  if (response.error) {
    throw new Error(response.error)
  }

  const data = response.data

  if (Array.isArray(data)) {
    return { results: data, hasMore: false }
  }

  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return {
      results: data.results,
      hasMore: Boolean(data.next),
    }
  }

  console.warn('Unexpected permissions data format:', data)
  return { results: [], hasMore: false }
}

/** First page only; same as `listPermissionsPage(1).results`. */
export async function listPermissions(): Promise<PermissionRecord[]> {
  const { results } = await listPermissionsPage(1)
  return results
}

export async function createGroup(name: string, permissionIds: number[]) {
  // Check authentication inside the action
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create groups' }
  }

  // Validate inputs with Zod - never trust form data
  const validation = validateData({ name, permissionIds }, groupSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.post('/groups/', {
    name: validation.data.name,
    permissions: validation.data.permissionIds,
  })

  if (response.error) {
    return { success: false, error: response.error || 'Failed to create group' }
  }

  return { success: true, message: 'Group created successfully!' }
}

export async function updateGroup(id: number, name: string, permissionIds: number[]) {
  // Check authentication inside the action
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to update groups' }
  }

  // Validate ID with Zod
  const idValidation = validateData(id, idSchema)
  if (!idValidation.success) {
    return { success: false, error: 'Invalid group ID' }
  }

  // Validate group data with Zod - never trust form data
  const validation = validateData({ name, permissionIds }, groupSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const response = await serverApi.put(`/groups/${idValidation.data}/`, {
    name: validation.data.name,
    permissions: validation.data.permissionIds,
  })

  if (response.error) {
    return { success: false, error: response.error || 'Failed to update group' }
  }

  return { success: true, message: 'Group updated successfully!' }
}

export async function deleteGroup(id: number) {
  // Check authentication inside the action
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to delete groups' }
  }

  // Validate ID with Zod - never trust form data
  const validation = validateData(id, idSchema)
  if (!validation.success) {
    return { success: false, error: 'Invalid group ID' }
  }

  const response = await serverApi.delete(`/groups/${validation.data}/`)

  if (response.error) {
    return { success: false, error: response.error || 'Failed to delete group' }
  }

  return { success: true, message: 'Group deleted successfully!' }
}
