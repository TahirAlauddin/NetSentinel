"use client"

import { AppShell } from "@/components/app-shell"
import { addUser, listUsers } from "./actions"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import UserList from "@/components/users-list"
import AddUserForm from "@/components/add-user-form"
import { LoadingState } from "@/components/loading-state"
import { AuthRequiredState } from "@/components/auth-required-state"
import { PermissionDeniedState } from "@/components/permission-denied-state"
import { UserRecord } from "@/types/users"


export default function SettingsPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await addUser(formData)
      
      if (result.success) {
        toast.success(result.message || 'User created successfully!')
        // Refresh users list after successful addition
        const userList = await listUsers()
        setUsers(Array.isArray(userList) ? userList : [])
        // Reset form
        e.currentTarget.reset()
      } else {
        toast.error(result.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Failed to add user:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const isAdmin = session?.user?.isSuperuser || false

  useEffect(() => {
    async function fetchUsers() {
      try {
        const userList = await listUsers()
        console.log('Fetched users:', userList)
        setUsers(Array.isArray(userList) ? userList : [])
      } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.error('Failed to load users. Please check if you are logged in.')
        setUsers([]) // Ensure users is always an array
      } finally {
        setLoading(false)
      }
    }
    
    if (session) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [session])

  if (loading) {
    return <LoadingState />
  }

  if (!session || session.error === 'RefreshAccessTokenError') {
    return <AuthRequiredState />
  }

  if (!isAdmin) {
    return <PermissionDeniedState />
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="border-b border-border pb-2">
          <h1 className="text-xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage users for NetSentinel.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Users table */}
          <section className="xl:col-span-2 rounded-md border border-border bg-card text-card-foreground">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Existing Users</h2>
            </div>
            <div className="p-2 sm:p-4 overflow-x-auto">
              <UserList users={users} />
            </div>
          </section>

          {/* Add user form */}
          <section className="rounded-md border border-border bg-card text-card-foreground">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Add User</h2>
            </div>
            <div className="p-3 sm:p-4">
              {!isAdmin ? (
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Only the admin can add users. Sign in as <span className="font-medium">admin</span> to proceed.
                </div>
              ) : (
                <AddUserForm handleAddUser={handleAddUser} submitting={submitting} />
              )}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  )
}
