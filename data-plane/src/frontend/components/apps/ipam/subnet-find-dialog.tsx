"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, X, ExternalLink } from "lucide-react";
import { Subnet, SubnetGroup } from "@/types/ipam";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface SubnetFindDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubnetFindDialog({ open, onOpenChange }: SubnetFindDialogProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [groupFilter, setGroupFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [results, setResults] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter options
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);

  // Load filter options
  useEffect(() => {
    if (open) {
      loadFilterOptions();
    }
  }, [open]);

  const loadFilterOptions = async () => {
    try {
      const groupsRes = await ipamApi.getSubnetGroups();

      if (groupsRes.data) {
        const groupsData = extractIpamArrayData<SubnetGroup>(groupsRes.data);
        setGroups(groupsData.map((g) => ({ id: g.id, name: g.name })));
      }

      // Load locations from infrastructure API
      try {
        const { api } = await import("@/lib/utils");
        const locationsRes = await api.get("/infrastructure/locations/");
        if (locationsRes.data) {
          const locationsData = extractIpamArrayData<{ id: number; name: string }>(locationsRes.data);
          setLocations(
            locationsData.map((l) => ({
              id: l.id,
              name: l.name,
            }))
          );
        }
      } catch (err) {
        console.error("Error loading locations:", err);
      }
    } catch (error) {
      console.error("Error loading filter options:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !statusFilter && !groupFilter && !locationFilter) {
      toast.error("Please enter a search query or select at least one filter");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params: Record<string, unknown> = {};

      // Add search query if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add filters
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (groupFilter) {
        params.group = groupFilter;
      }
      if (locationFilter) {
        params.location = locationFilter;
      }

      const response = await ipamApi.getSubnets(params);

      if (response.error) {
        throw new Error(response.error);
      }

      setResults(extractIpamArrayData(response.data));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to search subnets";
      console.error("[SubnetFindDialog] Error searching subnets:", err);
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
    setGroupFilter("");
    setLocationFilter("");
    setResults([]);
    setHasSearched(false);
  };

  const handleSubnetSelect = (subnet: Subnet) => {
    router.push(`/ipam/subnets/edit/${subnet.id}`);
    onOpenChange(false);
  };

  const hasActiveFilters = statusFilter || groupFilter || locationFilter || searchQuery.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Find Subnet</DialogTitle>
          <DialogDescription>
            Search for subnets by network address, description, or use filters to narrow down results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by network (e.g., 192.168.1.0/24) or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-filter">Group</Label>
              <Select value={groupFilter || "all"} onValueChange={(value) => setGroupFilter(value === "all" ? "" : value)}>
                <SelectTrigger id="group-filter">
                  <SelectValue placeholder="All groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location-filter">Location</Label>
              <Select value={locationFilter || "all"} onValueChange={(value) => setLocationFilter(value === "all" ? "" : value)}>
                <SelectTrigger id="location-filter">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto border rounded-md">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Searching...</div>
            ) : hasSearched && results.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No subnets found matching your search criteria
              </div>
            ) : hasSearched && results.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Network</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[100px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((subnet) => (
                    <TableRow
                      key={subnet.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSubnetSelect(subnet)}
                    >
                      <TableCell className="font-mono">{subnet.network}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {subnet.description || "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            subnet.status === "active"
                              ? "bg-green-100 text-green-800"
                              : subnet.status === "planned"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {subnet.status_display}
                        </span>
                      </TableCell>
                      <TableCell>{subnet.group_detail?.name || "-"}</TableCell>
                      <TableCell>{subnet.location_detail?.name || "-"}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubnetSelect(subnet)}
                          className="gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                Enter a search query or select filters and click Search to find subnets
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
