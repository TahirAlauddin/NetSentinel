"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, History, Globe, ArrowRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IpamApiClient } from "@/lib/api-client/ipam";
import { extractIpamArrayData } from "@/lib/ipam-utils";
import type { IPAddress, Subnet, Customer } from "@/types/ipam";
import { toast } from "sonner";
import { listAssets } from "@/app/(app)/assets/actions";

const ipamApi = new IpamApiClient();

interface IPSearchEnhancedProps {
  onIPSelect?: (ip: IPAddress) => void;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount: number;
}

const SEARCH_HISTORY_KEY = "ipam_search_history";
const MAX_HISTORY_ITEMS = 10;

export function IPSearchEnhanced({ onIPSelect }: IPSearchEnhancedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [subnetFilter, setSubnetFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [assetFilter, setAssetFilter] = useState<string>("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [hostnameQuery, setHostnameQuery] = useState("");
  const [results, setResults] = useState<IPAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState<"basic" | "range" | "hostname">("basic");
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Filter options
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Array<{ id: number; name: string }>>([]);

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [subnetsRes, customersRes, assetsRes] = await Promise.all([
          ipamApi.getSubnets(),
          ipamApi.getCustomers(),
          listAssets(),
        ]);

        if (subnetsRes.data) {
          setSubnets(extractIpamArrayData<Subnet>(subnetsRes.data));
        }
        if (customersRes.data) {
          setCustomers(extractIpamArrayData<Customer>(customersRes.data));
        }
        if (assetsRes) {
          setAssets(assetsRes.map((a) => ({ id: a.id, name: a.name })));
        }
      } catch (error) {
        console.error("Error loading filter options:", error);
      }
    };

    loadFilterOptions();
    loadSearchHistory();
  }, []);

  const loadSearchHistory = () => {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading search history:", error);
    }
  };

  const saveToHistory = (query: string, resultCount: number) => {
    const newItem: SearchHistoryItem = {
      query,
      timestamp: Date.now(),
      resultCount,
    };

    const updated = [
      newItem,
      ...searchHistory.filter((item) => item.query !== query),
    ].slice(0, MAX_HISTORY_ITEMS);

    setSearchHistory(updated);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving search history:", error);
    }
  };

  const handleBasicSearch = async () => {
    if (!searchQuery.trim() && !statusFilter && !subnetFilter && !customerFilter && !assetFilter) {
      toast.error("Please enter a search query or select at least one filter");
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
      if (subnetFilter) {
        params.subnet = subnetFilter;
      }
      if (customerFilter) {
        params.customer = customerFilter;
      }
      if (assetFilter) {
        params.assigned_to_asset = assetFilter;
      }

      const response = await ipamApi.searchIPAddresses(params);
      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);
      
      if (searchQuery.trim()) {
        saveToHistory(searchQuery.trim(), resultData.length);
      }
    } catch (error) {
      console.error("Error searching IPs:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search IP addresses");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRangeSearch = async () => {
    if (!rangeStart.trim() || !rangeEnd.trim()) {
      toast.error("Please enter both start and end IP addresses");
      return;
    }

    setLoading(true);
    try {
      const subnetId = subnetFilter ? parseInt(subnetFilter) : undefined;
      const response = await ipamApi.searchIPRange(rangeStart.trim(), rangeEnd.trim(), subnetId);
      
      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);
      saveToHistory(`${rangeStart} - ${rangeEnd}`, resultData.length);
    } catch (error) {
      console.error("Error searching IP range:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search IP range");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHostnameSearch = async () => {
    if (!hostnameQuery.trim()) {
      toast.error("Please enter a hostname");
      return;
    }

    setLoading(true);
    try {
      const response = await ipamApi.searchByHostname(hostnameQuery.trim());
      
      if (response.error) {
        throw new Error(response.error);
      }

      const resultData = Array.isArray(response.data) ? response.data : [];
      setResults(resultData);
      saveToHistory(hostnameQuery.trim(), resultData.length);
    } catch (error) {
      console.error("Error searching by hostname:", error);
      toast.error(error instanceof Error ? error.message : "Failed to search by hostname");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchMode === "range") {
      handleRangeSearch();
    } else if (searchMode === "hostname") {
      handleHostnameSearch();
    } else {
      handleBasicSearch();
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setStatusFilter("");
    setSubnetFilter("");
    setCustomerFilter("");
    setAssetFilter("");
    setRangeStart("");
    setRangeEnd("");
    setHostnameQuery("");
    setResults([]);
  };

  const handleHistoryClick = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setSearchMode("basic");
    // Trigger search after a short delay
    setTimeout(() => {
      handleBasicSearch();
    }, 100);
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

  const hasActiveFilters = searchQuery || statusFilter || subnetFilter || customerFilter || assetFilter || rangeStart || rangeEnd || hostnameQuery;

  return (
    <div className="space-y-4">
      {/* Search Tabs */}
      <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as typeof searchMode)}>
        <TabsList>
          <TabsTrigger value="basic">Basic Search</TabsTrigger>
          <TabsTrigger value="range">IP Range</TabsTrigger>
          <TabsTrigger value="hostname">Hostname/DNS</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
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
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClear} className="gap-2">
                    <X className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="subnet-filter">Subnet</Label>
                    <Select value={subnetFilter} onValueChange={setSubnetFilter}>
                      <SelectTrigger id="subnet-filter">
                        <SelectValue placeholder="All subnets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All subnets</SelectItem>
                        {subnets.map((subnet) => (
                          <SelectItem key={subnet.id} value={subnet.id.toString()}>
                            {subnet.network}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer-filter">Customer</Label>
                    <Select value={customerFilter} onValueChange={setCustomerFilter}>
                      <SelectTrigger id="customer-filter">
                        <SelectValue placeholder="All customers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All customers</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="asset-filter">Device/Asset</Label>
                    <Select value={assetFilter} onValueChange={setAssetFilter}>
                      <SelectTrigger id="asset-filter">
                        <SelectValue placeholder="All assets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All assets</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id.toString()}>
                            {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="range" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="range-start">Start IP</Label>
                  <Input
                    id="range-start"
                    placeholder="192.168.1.1"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground mb-2" />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="range-end">End IP</Label>
                  <Input
                    id="range-end"
                    placeholder="192.168.1.100"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="range-subnet">Subnet (optional)</Label>
                  <Select value={subnetFilter} onValueChange={setSubnetFilter}>
                    <SelectTrigger id="range-subnet" className="w-[200px]">
                      <SelectValue placeholder="All subnets" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All subnets</SelectItem>
                      {subnets.map((subnet) => (
                        <SelectItem key={subnet.id} value={subnet.id.toString()}>
                          {subnet.network}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? "Searching..." : "Search"}
                </Button>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hostname" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter hostname or FQDN (e.g., server.example.com)"
                    value={hostnameQuery}
                    onChange={(e) => setHostnameQuery(e.target.value)}
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
                  <Button variant="outline" onClick={handleClear}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Searches DNS records (A and AAAA) to find associated IP addresses
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleHistoryClick(item)}
                  className="text-xs"
                >
                  {item.query}
                  <Badge variant="secondary" className="ml-2">
                    {item.resultCount}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length})</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {!loading && results.length === 0 && hasActiveFilters && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No IP addresses found matching your search
          </CardContent>
        </Card>
      )}
    </div>
  );
}
