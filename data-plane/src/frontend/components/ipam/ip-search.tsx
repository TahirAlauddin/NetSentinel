"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IpamApiClient } from "@/lib/api-client/ipam";
import type { IPAddress } from "@/types/ipam";
import { toast } from "sonner";

const ipamApi = new IpamApiClient();

interface IPSearchProps {
  onIPSelect?: (ip: IPAddress) => void;
}

export function IPSearch({ onIPSelect }: IPSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [results, setResults] = useState<IPAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() && !statusFilter) {
      toast.error("Please enter a search query or select a filter");
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
      }
      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await ipamApi.searchIPAddresses(params);
      if (response.error) {
        throw new Error(response.error);
      }

      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error searching IPs:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search IP addresses");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
    setResults([]);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      assigned: "default",
      reserved: "secondary",
      available: "outline",
      dhcp: "secondary",
      deprecated: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by IP address, description, or asset name..."
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
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            {(searchQuery || statusFilter || results.length > 0) && (
              <Button variant="outline" onClick={handleClear} className="gap-2">
                <X className="w-4 h-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="dhcp">DHCP</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Search Results ({results.length})</h3>
              </div>
              <div className="space-y-2">
                {results.map((ip) => (
                  <div
                    key={ip.id}
                    className="p-3 border rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => onIPSelect?.(ip)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">{ip.address}</span>
                          {getStatusBadge(ip.status)}
                        </div>
                        {ip.subnet_detail && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Subnet: {ip.subnet_detail.network}
                          </div>
                        )}
                        {ip.description && (
                          <div className="text-sm text-muted-foreground mt-1">{ip.description}</div>
                        )}
                        {ip.assigned_to_asset_detail && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Assigned to: {ip.assigned_to_asset_detail.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && results.length === 0 && (searchQuery || statusFilter) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No IP addresses found matching your search
          </CardContent>
        </Card>
      )}
    </div>
  );
}
