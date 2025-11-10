"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { UserRecord } from "@/types/users"
import { GroupRecord, PermissionRecord } from "@/types/groups"

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
  if (users && typeof users === 'object' && 'results' in users && Array.isArray((users as any).results)) {
    return (users as any).results
  }
  
  // If no valid data format, return empty array
  console.warn('Unexpected users data format:', users)
  return []
}

export async function addUser(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create users' }
  }

  const username = String(formData.get("username") || "").trim()
  const email = String(formData.get("email") || "").trim().toLowerCase()
  const password = String(formData.get("password") || "").trim()
  const re_password = String(formData.get("re_password") || "").trim()

  if (!username || !email || !password || !re_password) {
    return { success: false, error: 'All fields are required' }
  }

  if (password !== re_password) {
    return { success: false, error: 'Passwords do not match' }
  }

  const response = await serverApi.post('/auth/users/', {
    username,
    email,
    password,
    re_password,
    first_name: username, // Use username as first name for now
    last_name: '', // Empty last name for now
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
  if (groups && typeof groups === 'object' && 'results' in groups && Array.isArray((groups as any).results)) {
    return (groups as any).results
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
  
  if (permissions && typeof permissions === 'object' && 'results' in permissions && Array.isArray((permissions as any).results)) {
    return (permissions as any).results
  }
  
  console.warn('Unexpected permissions data format:', permissions)
  return []
}

export async function createGroup(name: string, permissionIds: number[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create groups' }
  }

  if (!name || !name.trim()) {
    return { success: false, error: 'Group name is required' }
  }

  const response = await serverApi.post('/groups/', {
    name: name.trim(),
    permissions: permissionIds || [],
  })

  if (response.error) {
    return { success: false, error: response.error || 'Failed to create group' }
  }

  return { success: true, message: 'Group created successfully!' }
}

export async function updateGroup(id: number, name: string, permissionIds: number[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to update groups' }
  }

  if (!name || !name.trim()) {
    return { success: false, error: 'Group name is required' }
  }

  const response = await serverApi.put(`/groups/${id}/`, {
    name: name.trim(),
    permissions: permissionIds || [],
  })

  if (response.error) {
    return { success: false, error: response.error || 'Failed to update group' }
  }

  return { success: true, message: 'Group updated successfully!' }
}

export async function deleteGroup(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to delete groups' }
  }

  const response = await serverApi.delete(`/groups/${id}/`)

  if (response.error) {
    return { success: false, error: response.error || 'Failed to delete group' }
  }

  return { success: true, message: 'Group deleted successfully!' }
}
