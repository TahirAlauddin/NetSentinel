"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { IpamHeader } from "@/components/ipam/ipam-header";
import { IpamNavTabs } from "@/components/ipam/ipam-nav-tabs";
import { SubnetTable } from "@/components/ipam/subnet-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Plus } from "lucide-react";
import { Subnet } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";

const ipamApi = new IpamApiClient();

/**
 * Favorite Subnets Page
 * Displays only the user's favorite subnets
 */
export default function FavouriteSubnetsPage() {
  const router = useRouter();
  const [allSubnets, setAllSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter to only show favorite subnets
  const favoriteSubnets = useMemo(() => {
    return allSubnets.filter((subnet) => subnet.is_favorite === true);
  }, [allSubnets]);

  const loadSubnets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ipamApi.getSubnets();
      
      if (response.error) {
        throw new Error(response.error);
      }

      setAllSubnets(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load favorite subnets";
      console.error("[FavouriteSubnetsPage] Error loading subnets:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load subnets from API
  useEffect(() => {
    loadSubnets();
  }, []);

  const handleEdit = (subnet: Subnet) => {
    router.push(`/ipam/subnets/edit/${subnet.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this subnet?")) {
      return;
    }

    try {
      setError(null);
      const response = await ipamApi.deleteSubnet(id);
      
      if (response.error) {
        throw new Error(response.error);
      }

      await loadSubnets();
      toast.success("Subnet deleted successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete subnet";
      console.error("[FavouriteSubnetsPage] Error deleting subnet:", err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const handleAdd = () => {
    router.push("/ipam/subnets/new");
  };

  const handleFind = () => {
    router.push("/ipam/search");
  };

  const handleToggleFavorite = async (subnet: Subnet) => {
    try {
      setError(null);
      const response = await ipamApi.toggleSubnetFavorite(subnet.id, false); // Remove from favorites
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Update the subnet in the list
      setAllSubnets((prevSubnets) =>
        prevSubnets.map((s) =>
          s.id === subnet.id
            ? { ...s, is_favorite: false }
            : s
        )
      );

      toast.success("Removed from favorites");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove from favorites";
      console.error("[FavouriteSubnetsPage] Error removing favorite:", err);
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <IpamHeader currentPage="Favourite Subnets" />
      <IpamNavTabs />

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && favoriteSubnets.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-muted-foreground" />
              No Favorite Subnets
            </CardTitle>
            <CardDescription>
              You haven&apos;t favorited any subnets yet. Add subnets to your favorites to quickly access them here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/ipam/subnets")} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Browse Subnets
              </Button>
              <Button onClick={handleFind} variant="outline">
                Search Subnets
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite Subnets Table */}
      {!loading && favoriteSubnets.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Your Favorite Subnets</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {favoriteSubnets.length} {favoriteSubnets.length === 1 ? "subnet" : "subnets"} in your favorites
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => router.push("/ipam/subnets")} variant="outline">
                Browse All Subnets
              </Button>
              <Button onClick={handleAdd} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Add Subnet
              </Button>
            </div>
          </div>

          <SubnetTable
            subnets={favoriteSubnets}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAdd={handleAdd}
            onFind={handleFind}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Loading favorite subnets...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
