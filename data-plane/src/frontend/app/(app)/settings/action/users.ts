"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { serverApi } from "@/lib/server-api"
import { UserRecord } from "@/types/users"
import {
  createUserSchema,
  parseFormData,
} from "@/lib/security/validation-schemas"

export type UserAssignments = {
  group_ids: number[]
  permission_ids: number[]
}

////////////////////////////////////////////////////////////
// Users
////////////////////////////////////////////////////////////
export async function listUsers(): Promise<UserRecord[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to list users")
  }

  const response = await serverApi.get<UserRecord[]>("/auth/users/")

  if (response.error) {
    throw new Error(response.error)
  }

  const users = response.data

  // Handle different response formats
  if (Array.isArray(users)) {
    return users
  }

  // Handle paginated response (if the API returns { results: [...] })
  if (
    users &&
    typeof users === "object" &&
    "results" in users &&
    Array.isArray((users as { results: UserRecord[] }).results)
  ) {
    return (users as { results: UserRecord[] }).results
  }

  console.warn("Unexpected users data format:", users)
  return []
}

export async function addUser(formData: FormData) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to create users" }
  }

  const validation = parseFormData(formData, createUserSchema)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const { username, email, password, re_password, first_name, last_name } =
    validation.data

  const response = await serverApi.post("/auth/users/", {
    username,
    email,
    password,
    re_password,
    first_name: first_name || username,
    last_name: last_name || "",
  })

  if (response.error) {
    return {
      success: false,
      error: response.error || "Failed to create user. Please try again.",
    }
  }

  const createdUserId =
    response.data && typeof response.data === "object" && "id" in response.data
      ? (response.data as { id: number | string }).id
      : null

  // Ensure a newly-created user starts permissionless.
  if (createdUserId) {
    await serverApi.put(`/users/${createdUserId}/assignments/`, {
      group_ids: [],
      permission_ids: [],
    })
  }

  return { success: true, message: "User created successfully!", userId: createdUserId }
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

////////////////////////////////////////////////////////////
// User Assignments
////////////////////////////////////////////////////////////
export async function getUserAssignments(userId: number): Promise<UserAssignments> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    throw new Error("Not authorized to get user assignments")
  }

  const response = await serverApi.get<UserAssignments>(
    `/users/${userId}/assignments/`,
  )
  if (response.error) {
    throw new Error(response.error)
  }

  return response.data ?? { group_ids: [], permission_ids: [] }
}

export async function updateUserAssignments(
  userId: number,
  groupIds: number[],
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update user assignments" }
  }

  const response = await serverApi.put(`/users/${userId}/assignments/`, {
    group_ids: groupIds,
    permission_ids: [],
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
  },
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperuser) {
    return { success: false, error: "Not authorized to update users" }
  }

  const user = await getUser(userId)
  if (!user) {
    return { success: false, error: "User not found" }
  }

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

