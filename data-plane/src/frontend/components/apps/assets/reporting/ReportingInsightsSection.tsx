"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Asset } from "@/types/assets";
import {
  calculateWarrantyStatus,
} from "@/components/apps/assets/utils/calculate";
import {
  getWarrantyColor,
  formatWarrantyStatus,
} from "@/components/apps/assets/utils/format";
import { Pagination } from "@/components/ui/pagination";
import { X } from "lucide-react";

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#a4de6c",
];

const ATTRIBUTE_OPTIONS = [
  "Operating System",
  "Applications",
  "Location",
  "Warranty",
  "Model",
  "Asset Type",
  "Department",
  "Cost",
  "Firmware",
] as const;

const ATTRIBUTE_ROUTES: Record<string, string> = {
  "Operating System": "/assets/reporting/operating-system",
  Applications: "/assets/reporting/applications",
  Location: "/assets/reporting/location",
  Warranty: "/assets/reporting/warranty",
  Model: "/assets/reporting/model",
  "Asset Type": "/assets/reporting/asset-type",
  Department: "/assets/reporting/department",
  Cost: "/assets/reporting/cost",
  Firmware: "/assets/reporting/firmware",
};

export type DistributionItem = { name: string; value: number; id?: string };

export interface ReportingInsightsSectionProps {
  assets: Asset[];
  categoryDistribution: DistributionItem[];
  osDistribution: Array<{ name: string; value: number }>;
  applicationsDistribution: Array<{ name: string; value: number }>;
  locationDistribution: Array<{ name: string; value: number }>;
  warrantyDistribution: Array<{ name: string; value: number }>;
  modelDistribution: Array<{ name: string; value: number }>;
  departmentDistribution: Array<{ name: string; value: number }>;
  costDistribution: Array<{ name: string; value: number }>;
  firmwareDistribution: Array<{ name: string; value: number }>;
  totalAssets: number;
  totalOS: number;
  totalApplications: number;
  /** When provided, "View All Details" and attribute clicks open this instead of navigating. */
  onOpenInsight?: (attribute: string) => void;
}

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

function getSelectedDistribution(
  attribute: string,
  props: ReportingInsightsSectionProps
): Array<{ name: string; value: number }> {
  switch (attribute) {
    case "Operating System":
      return props.osDistribution;
    case "Applications":
      return props.applicationsDistribution;
    case "Location":
      return props.locationDistribution;
    case "Warranty":
      return props.warrantyDistribution;
    case "Model":
      return props.modelDistribution;
    case "Asset Type":
      return props.categoryDistribution;
    case "Department":
      return props.departmentDistribution;
    case "Cost":
      return props.costDistribution;
    case "Firmware":
      return props.firmwareDistribution;
    default:
      return [];
  }
}

export function ReportingInsightsSection(props: ReportingInsightsSectionProps) {
  const router = useRouter();
  const [selectedAttribute, setSelectedAttribute] = useState<string>("Operating System");
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null);
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryPerPage, setCategoryPerPage] = useState(15);

  const selectedDistribution = getSelectedDistribution(selectedAttribute, props);

  const categoryAssets = useMemo(() => {
    if (!selectedCategory) return [];
    return props.assets.filter(
      (a) =>
        (selectedCategory.id && a.category?.id?.toString() === selectedCategory.id) ||
        (!selectedCategory.id && (a.category?.name ?? "Uncategorized") === selectedCategory.name)
    );
  }, [props.assets, selectedCategory]);

  const categoryTotalPages = Math.ceil(categoryAssets.length / categoryPerPage);
  const categoryPaginated = useMemo(
    () =>
      categoryAssets.slice(
        (categoryPage - 1) * categoryPerPage,
        categoryPage * categoryPerPage
      ),
    [categoryAssets, categoryPage, categoryPerPage]
  );
  const categoryPageStart = categoryAssets.length === 0 ? 0 : (categoryPage - 1) * categoryPerPage + 1;
  const categoryPageEnd = Math.min(categoryPage * categoryPerPage, categoryAssets.length);

  const renderDonutChart = (
    data: Array<{ name: string; value: number }>,
    total: number,
    label: string
  ) => {
    const chartData = data.length > 0 ? data : [{ name: "No Data", value: 1 }];
    return (
      <div className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center mt-2">
          <div className="text-2xl font-bold">{total}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </div>
    );
  };

  const renderInsightCard = (
    title: string,
    distribution: Array<{ name: string; value: number }>,
    total: number,
    label: string,
    route: string
  ) => (
    <Card className="p-6 relative">
      <div className="absolute top-4 right-4">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </Button>
      </div>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-rows-2 gap-6">
        {renderDonutChart(distribution.slice(0, 10), total, label)}
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {distribution.slice(0, 10).map((item, index) => (
            <div key={item.name} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColor(index) }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-sm font-semibold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full mt-4"
        onClick={() =>
          props.onOpenInsight ? props.onOpenInsight(title) : router.push(route)
        }
      >
        View All Details
      </Button>
    </Card>
  );

  return (
    <>
      {/* Asset Summary Section - 30% / 70% layout */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Asset Summary</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-8">
            {/* Left ~30%: Donut + category legend (clickable) */}
            <div className="flex flex-col gap-4">
              {renderDonutChart(props.categoryDistribution, props.totalAssets, "Assets")}
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {props.categoryDistribution.slice(0, 10).map((item, _index) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(
                        item.id ? { id: item.id, name: item.name } : { id: "", name: item.name }
                      )
                    }
                    className="w-full flex justify-between items-center text-left px-2 py-1.5 rounded hover:bg-muted/80 transition-colors"
                  >
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right ~70%: Attribute tabs + distribution + View All Details */}
            <div className="min-w-0">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {ATTRIBUTE_OPTIONS.map((attr) => (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => setSelectedAttribute(attr)}
                    className={`px-3 py-1 text-sm whitespace-nowrap rounded transition-colors ${
                      selectedAttribute === attr
                        ? "bg-primary/10 text-primary font-medium underline"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {attr}
                  </button>
                ))}
              </div>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {selectedDistribution.slice(0, 10).map((item, index) => (
                  <button
                    key={item.name}
                    type="button"
                    className="w-full flex items-center gap-2 p-2 bg-muted/50 rounded cursor-pointer hover:bg-muted transition-colors text-left"
                    onClick={() =>
                      props.onOpenInsight
                        ? props.onOpenInsight(selectedAttribute)
                        : router.push(ATTRIBUTE_ROUTES[selectedAttribute] ?? "#")
                    }
                  >
                    <div
                      className="w-2 h-8 rounded shrink-0"
                      style={{ backgroundColor: getColor(index) }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">{item.value}</span>
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() =>
                  props.onOpenInsight
                    ? props.onOpenInsight(selectedAttribute)
                    : router.push(ATTRIBUTE_ROUTES[selectedAttribute] ?? "#")
                }
              >
                View All Details
              </Button>
            </div>
          </div>
        </Card>

        {/* Assets by category (when a category label is clicked) */}
        {selectedCategory && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">
                Assets ({categoryAssets.length})
              </h3>
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                {selectedCategory.name}
                <X className="w-3 h-3" />
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Results per page</span>
                <select
                  value={categoryPerPage}
                  onChange={(e) => {
                    setCategoryPerPage(Number(e.target.value));
                    setCategoryPage(1);
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {[10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {categoryTotalPages > 1 && (
                <Pagination
                  currentPage={categoryPage}
                  totalPages={categoryTotalPages}
                  totalItems={categoryAssets.length}
                  pageStart={categoryPageStart}
                  pageEnd={categoryPageEnd}
                  onPageChange={setCategoryPage}
                  itemLabel="assets"
                  className="sm:ml-auto"
                />
              )}
            </div>
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Warranty Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryPaginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          No assets in this category
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoryPaginated.map((asset) => {
                        const warrantyStatus = asset.warranty_expiration
                          ? calculateWarrantyStatus(asset.warranty_expiration)
                          : "no_warranty";
                        const label =
                          warrantyStatus === "no_warranty"
                            ? "No warranty info"
                            : formatWarrantyStatus(warrantyStatus);
                        return (
                          <TableRow
                            key={asset.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/assets/${asset.id}`)}
                          >
                            <TableCell>
                              <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                                <span className="text-xs">•</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{asset.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: getWarrantyColor(warrantyStatus),
                                  }}
                                />
                                <span className="text-sm">{label}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Asset Insights Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Asset Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderInsightCard(
            "Operating System",
            props.osDistribution,
            props.totalOS,
            "OS",
            "/assets/reporting/operating-system"
          )}
          {renderInsightCard(
            "Applications",
            props.applicationsDistribution,
            props.totalApplications,
            "Applications",
            "/assets/reporting/applications"
          )}
          {renderInsightCard(
            "Location",
            props.locationDistribution,
            props.totalAssets,
            "Assets",
            "/assets/reporting/location"
          )}
        </div>
      </div>
    </>
  );
}
