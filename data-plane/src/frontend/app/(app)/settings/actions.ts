"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { UserRecord } from "@/types/users"

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
