"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useFunnelStats } from "@/hooks/useSubscribers";

const funnelStages = [
  {
    stage: 0,
    label: "Commented",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    stage: 1,
    label: "Product Inquiry",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    stage: 2,
    label: "Viewed Price",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    stage: 3,
    label: "Add To Cart",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    stage: 4,
    label: "Converted/ Purchased",
    color: "bg-green-50 text-green-700 border-green-200",
  },
];

export function FunnelGraph() {
  const { data: funnelStats, loading } = useFunnelStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Funnel Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div
                  className="h-16 bg-gray-200 rounded-lg"
                  style={{ width: `${100 - i * 10}%` }}
                ></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCount = funnelStats.reduce((sum, stat) => sum + stat.count, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Funnel Overview
        </CardTitle>
        <p className="text-sm text-gray-600">
          {totalCount.toLocaleString()} total subscribers across all stages
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {funnelStages.map((stage, i) => {
          const stat = funnelStats.find((s) => s.funnel_stage === stage.stage);
          const count = stat?.count || 0;
          const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
          const width = Math.max(20, 100 - i * 12); // Minimum width for visibility

          return (
            <div key={stage.stage} className="relative">
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:shadow-md",
                  stage.color
                )}
                style={{ width: `${width}%`, minWidth: "200px" }}
              >
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium mb-1">
                        Stage {stage.stage}: {stage.label}
                      </div>
                      <div className="text-2xl font-bold">
                        {count.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-75">
                        {percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar at bottom */}
                <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full">
                  <div
                    className="h-full bg-black/20 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {/* Connector line */}
              {i < funnelStages.length - 1 && (
                <div className="absolute left-1/2 -bottom-3 w-0.5 h-6 bg-gray-300 transform -translate-x-1/2 z-10" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
