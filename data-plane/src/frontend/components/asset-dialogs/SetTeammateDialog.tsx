"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User } from "lucide-react"
import { api } from "@/lib/utils"
import { UserRecord } from "@/types/users"
import { extractData } from "./utils"
import { UserDisplay } from "./types"

export interface SetTeammateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { userId: string; userName: string }) => void
  currentValue?: string
}

export function SetTeammateDialog({ open, onOpenChange, onSave, currentValue }: SetTeammateDialogProps) {
  const [selectedUser, setSelectedUser] = useState(currentValue || "")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<UserDisplay[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      async function fetchUsers() {
        try {
          setLoading(true)
          setError(null)

          const response = await api.get<UserRecord[] | { results: UserRecord[] }>("/auth/users/")
          if (response.data) {
            const usersData = extractData(response.data)
            const mappedUsers: UserDisplay[] = usersData.map((user) => ({
              id: user.id,
              name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username,
              email: user.email,
              department: undefined, // Department not available in UserRecord
            }))
            setUsers(mappedUsers)
          }
        } catch (err) {
          console.error("Failed to fetch users:", err)
          setError(err instanceof Error ? err.message : "Failed to fetch users")
        } finally {
          setLoading(false)
        }
      }
      fetchUsers()
    }
  }, [open])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSave = () => {
    const user = users.find((u) => u.id === selectedUser)
    if (user) {
      onSave({ userId: user.id, userName: user.name })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Set Teammate
          </DialogTitle>
          <DialogDescription>Assign a team member to manage this asset.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search-user">Search teammate</Label>
            <Input
              id="search-user"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Select teammate</Label>
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">Loading users...</div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-500">{error}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  {searchQuery ? "No users found matching your search." : "No users available."}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedUser === user.id ? "bg-blue-50 border-l-2 border-blue-600" : ""
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                    {user.department && (
                      <div className="text-xs text-gray-400">{user.department}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedUser}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

