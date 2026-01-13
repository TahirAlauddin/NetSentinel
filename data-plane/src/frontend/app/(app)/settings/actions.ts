"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { UserRecord } from "@/types/users"
import { GroupRecord, PermissionRecord } from "@/types/groups"
import {
  validateString,
  validateEmail,
  validateId,
  validateIdArray,
  validateFormDataField,
} from "@/lib/security/input-validation"

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
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create users' }
  }

  // Validate and sanitize all inputs
  const username = validateFormDataField(formData, "username", {
    required: true,
    maxLength: 150,
    pattern: /^[a-zA-Z0-9@.+\-_]+$/,
  })
  
  const email = validateEmail(formData.get("email"))
  const password = validateFormDataField(formData, "password", {
    required: true,
    maxLength: 128,
    minLength: 8,
  })
  const re_password = validateFormDataField(formData, "re_password", {
    required: true,
    maxLength: 128,
    minLength: 8,
  })

  if (!username || !email || !password || !re_password) {
    return { success: false, error: 'Invalid input. Please check all fields.' }
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
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: 'Not authorized to create groups' }
  }

  // Validate and sanitize inputs
  const validatedName = validateString(name, {
    allowEmpty: false,
    maxLength: 150,
    minLength: 1,
  })

  if (!validatedName) {
    return { success: false, error: 'Group name is required and must be valid' }
  }

  const validatedPermissionIds = validateIdArray(permissionIds)
  if (validatedPermissionIds === null) {
    return { success: false, error: 'Invalid permission IDs' }
  }

  const response = await serverApi.post('/groups/', {
    name: validatedName,
    permissions: validatedPermissionIds,
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

  // Validate and sanitize inputs
  const validatedId = validateId(id)
  if (!validatedId) {
    return { success: false, error: 'Invalid group ID' }
  }

  const validatedName = validateString(name, {
    allowEmpty: false,
    maxLength: 150,
    minLength: 1,
  })

  if (!validatedName) {
    return { success: false, error: 'Group name is required and must be valid' }
  }

  const validatedPermissionIds = validateIdArray(permissionIds)
  if (validatedPermissionIds === null) {
    return { success: false, error: 'Invalid permission IDs' }
  }

  const response = await serverApi.put(`/groups/${validatedId}/`, {
    name: validatedName,
    permissions: validatedPermissionIds,
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

  // Validate ID
  const validatedId = validateId(id)
  if (!validatedId) {
    return { success: false, error: 'Invalid group ID' }
  }

  const response = await serverApi.delete(`/groups/${validatedId}/`)

  if (response.error) {
    return { success: false, error: response.error || 'Failed to delete group' }
  }

  return { success: true, message: 'Group deleted successfully!' }
}
