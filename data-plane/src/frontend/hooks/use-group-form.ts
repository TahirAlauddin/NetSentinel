"use client";

import { useCallback, useState } from "react";
import type { GroupRecord } from "@/types/groups";
import {
  buildEmptyAppAccess,
  type AppAccessSelection,
} from "@/constants/permissions-by-app";

export type UseGroupFormReturn = {
  name: string;
  setName: (name: string) => void;
  appAccess: AppAccessSelection;
  setAppAccess: (levels: AppAccessSelection) => void;
  initialize: (opts: { group?: GroupRecord; appAccess?: AppAccessSelection }) => void;
  reset: () => void;
};

/**
 * This hook is used to manage the state of the group form.
 * It is used to initialize the form with the group data and the app access selection.
 */
export function useGroupForm(): UseGroupFormReturn {
  const [name, setName] = useState("");
  const [appAccess, setAppAccess] = useState<AppAccessSelection>(buildEmptyAppAccess);

  const initialize = useCallback(
    ({ group, appAccess: initialAppAccess }: { group?: GroupRecord; appAccess?: AppAccessSelection }) => {
      if (group) {
        setName(group.name ?? "");
      }
      setAppAccess(initialAppAccess ?? buildEmptyAppAccess());
    },
    []
  );

  const reset = useCallback(() => {
    setName("");
    setAppAccess(buildEmptyAppAccess());
  }, []);

  return { name, setName, appAccess, setAppAccess, initialize, reset };
}
