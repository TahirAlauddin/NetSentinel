"use client";

import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/components/feedback/protected-route";
import { SettingsHeader } from "@/components/settings/settings-header";
import { validateId } from "@/lib/security/input-validation";
import { useParams } from "next/navigation";
import { GroupRecord } from "@/types/groups";
import AppLevelPermissionSelect from "@/components/permissions/app-access-level-select";
import { usePeopleDetail } from "@/hooks/use-people-detail";

function GroupsPicker({
  groups,
  selectedGroupIds,
  setSelectedGroupIds,
}: {
  groups: GroupRecord[];
  selectedGroupIds: number[];
  setSelectedGroupIds: (ids: number[]) => void;
}) {
  const toggleGroup = (groupId: number) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((id) => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  return (
    <div className="max-h-64 overflow-y-auto border border-border rounded-md p-3 space-y-2 bg-background">
      {groups.length > 0 ? (
        groups.map((g) => (
          <label
            key={g.id}
            className="flex items-center gap-2 text-sm cursor-pointer hover:bg-[oklch(0.98_0_0)] p-1 rounded"
          >
            <input
              type="checkbox"
              checked={selectedGroupIds.includes(g.id)}
              onChange={() => toggleGroup(g.id)}
              className="rounded border-input"
            />
            <span className="text-xs">{g.name}</span>
          </label>
        ))
      ) : (
        <div className="text-xs text-muted-foreground text-center py-4">No groups found</div>
      )}
    </div>
  );
}

export default function PeopleDetailPage() {
  const params = useParams();
  const personId = validateId(params.id);
  const {
    loadingInitial,
    saving,
    basicSaving,
    groups,
    selectedGroupIds,
    setSelectedGroupIds,
    username,
    setUsername,
    email,
    setEmail,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    saveDetails,
    saveAssignments,
  } = usePeopleDetail(personId);

  if (personId === null) return null;

  if (loadingInitial) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="min-h-[calc(100dvh-120px)]">
            <div className="p-8">
              <SettingsHeader currentPage="User Detail" />
              <div className="text-sm text-muted-foreground mt-4">Loading...</div>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="min-h-[calc(100dvh-120px)]">
          <div className="p-8">
            <div className="space-y-6">
              <SettingsHeader currentPage="User Detail" />

              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                <div className="bg-card border border-border rounded-lg p-4">
                  <h2 className="text-sm font-medium mb-4">User details</h2>

                  <div className="grid gap-3 max-w-2xl">
                    <div className="grid gap-1">
                      <label className="text-xs sm:text-sm text-muted-foreground">Username</label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-1">
                      <label className="text-xs sm:text-sm text-muted-foreground">Email</label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                      />
                    </div>

                    <div className="grid gap-1 sm:grid-cols-2 sm:gap-3">
                      <div className="grid gap-1">
                        <label className="text-xs sm:text-sm text-muted-foreground">
                          First name
                        </label>
                        <input
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                        />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-xs sm:text-sm text-muted-foreground">
                          Last name
                        </label>
                        <input
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-9 sm:h-10 rounded-md border border-input bg-background px-2 sm:px-3 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-1">
                      <button
                        type="button"
                        disabled={basicSaving}
                        onClick={saveDetails}
                        className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {basicSaving ? "Saving..." : "Edit"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <h2 className="text-sm font-medium mb-4">Group assignments</h2>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Groups</div>
                      <GroupsPicker
                        groups={groups}
                        selectedGroupIds={selectedGroupIds}
                        setSelectedGroupIds={setSelectedGroupIds}
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <AppLevelPermissionSelect disabled={saving} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={saveAssignments}
                  className="px-4 py-2 rounded-md bg-red-500 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {saving ? "Saving..." : "Save assignments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
