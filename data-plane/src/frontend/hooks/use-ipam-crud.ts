/**
 * Custom hook for IPAM CRUD operations
 * Provides reusable state management and handlers for IPAM entity pages
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BaseApiResponse } from "@/lib/api-client";
import { extractIpamArrayData } from "@/lib/ipam-utils";

interface UseIpamCrudOptions<T> {
  /**
   * Function to fetch all items
   */
  fetchAll: () => Promise<BaseApiResponse<T[] | unknown>>;
  /**
   * Function to delete an item by ID
   */
  deleteItem: (id: number | string) => Promise<BaseApiResponse<unknown>>;
  /**
   * Route prefix for navigation (e.g., "/ipam/subnets")
   */
  routePrefix: string;
  /**
   * Entity name for error messages (e.g., "subnet", "VLAN")
   */
  entityName: string;
  /**
   * Optional: Custom error handler
   */
  onError?: (error: string) => void;
}

interface UseIpamCrudReturn<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  handleEdit: (item: T & { id: number }) => void;
  handleDelete: (id: number) => Promise<void>;
  handleAdd: () => void;
}

/**
 * Custom hook for IPAM CRUD operations
 * @param options - Configuration options
 * @returns Object with items, loading state, error state, and handlers
 */
export function useIpamCrud<T>({
  fetchAll,
  deleteItem,
  routePrefix,
  entityName,
  onError,
}: UseIpamCrudOptions<T>): UseIpamCrudReturn<T> {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchAll();

      if (response.error) {
        throw new Error(response.error);
      }

      setItems(extractIpamArrayData<T>(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to load ${entityName}s`;
      console.error(`[useIpamCrud] Error loading ${entityName}s:`, err);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchAll, entityName, onError]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleEdit = useCallback(
    (item: T & { id: number }) => {
      router.push(`${routePrefix}/edit/${item.id}`);
    },
    [router, routePrefix]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      if (!confirm(`Are you sure you want to delete this ${entityName}?`)) {
        return;
      }

      try {
        setError(null);
        const response = await deleteItem(id);

        if (response.error) {
          throw new Error(response.error);
        }

        await loadItems();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to delete ${entityName}`;
        console.error(`[useIpamCrud] Error deleting ${entityName}:`, err);
        setError(errorMessage);
        onError?.(errorMessage);
      }
    },
    [deleteItem, entityName, loadItems, onError]
  );

  const handleAdd = useCallback(() => {
    router.push(`${routePrefix}/new`);
  }, [router, routePrefix]);

  return {
    items,
    loading,
    error,
    loadItems,
    handleEdit,
    handleDelete,
    handleAdd,
  };
}

