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
    return { success: false, error: 'Failed to create user. Please try again.' }
  }

  return { success: true, message: 'User created successfully!' }
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

export async function listPermissions(): Promise<PermissionRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error('Not authorized to list permissions')
  }

  const response = await serverApi.get<PermissionRecord[]>('/permissions/')
  
  if (response.error) {
    throw new Error(response.error)
  }

  const permissions = response.data
  
  if (Array.isArray(permissions)) {
    return permissions
  }
  
  if (permissions && typeof permissions === 'object' && 'results' in permissions && Array.isArray((permissions as { results: PermissionRecord[] }).results)) {
    return (permissions as { results: PermissionRecord[] }).results
  }
  
  console.warn('Unexpected permissions data format:', permissions)
  return []
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
