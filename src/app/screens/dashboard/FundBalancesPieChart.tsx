"use client";

import React, { useState, useMemo } from "react";
import { FundBalanceItem, GroupedFundType } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, Layers } from "lucide-react";

interface FundBalancesPieChartProps {
  items: FundBalanceItem[];
  isLoading?: boolean;
}

const KNOWN_COLOR_MAP: Record<string, string> = {
  "Money Market": "#d97706",
  "Iron Mountain": "#8b5cf6",
  Preservation: "#059669",
  Moderate: "#2563eb",
  Growth: "#008eab",
  "AR Cash": "#dc2626",
  "AP Cash": "#f97316",
  "Schwab Stock Fund": "#14b8a6",
};

const COLOR_PALETTE = [
  "#059669", // Emerald Green
  "#2563eb", // Royal Blue
  "#008eab", // Deep Teal / Cyan

  "#d97706", // Amber / Orange
  "#8b5cf6", // Purple
  "#dc2626", // Red
  "#f97316", // Bright Orange
  "#14b8a6", // Teal
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

export default function FundBalancesPieChart({
  items = [],
  isLoading = false,
}: FundBalancesPieChartProps) {
  const [activeGraphIndex, setActiveGraphIndex] = useState<number | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Group items by fundType
  const groupedData: GroupedFundType[] = useMemo(() => {
    if (!items || items.length === 0) return [];

    const map = new Map<string, FundBalanceItem[]>();
    let grandTotal = 0;

    items.forEach((item) => {
      const type = item.fundType || "Other";
      if (!map.has(type)) {
        map.set(type, []);
      }
      map.get(type)!.push(item);
      grandTotal += Number(item.fundBalance || 0);
    });

    const groups: GroupedFundType[] = [];
    let colorIdx = 0;

    map.forEach((fundList, type) => {
      const totalBal = fundList.reduce(
        (sum, f) => sum + Number(f.fundBalance || 0),
        0,
      );
      const aggPct = grandTotal > 0 ? (totalBal / grandTotal) * 100 : 0;
      const assignedColor =
        KNOWN_COLOR_MAP[type] || COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];

      groups.push({
        fundType: type,
        totalBalance: totalBal,
        aggregatePercentage: aggPct,
        color: assignedColor,
        funds: fundList,
      });

      colorIdx++;
    });

    // Sort by total balance descending
    return groups.sort((a, b) => b.totalBalance - a.totalBalance);
  }, [items]);

  const totalPortfolioValue = useMemo(() => {
    return groupedData.reduce((acc, g) => acc + g.totalBalance, 0);
  }, [groupedData]);

  // SVG Donut Slices Math
  const slices = useMemo(() => {
    if (totalPortfolioValue <= 0) return [];

    let currentAngle = 0;
    const cx = 100;
    const cy = 100;
    const outerR = 70;
    const innerR = 54;

    return groupedData.map((group, index) => {
      const fraction = group.totalBalance / totalPortfolioValue;
      const angle = fraction * 2 * Math.PI;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      if (fraction >= 0.9999) {
        return {
          ...group,
          d: `M ${cx} ${cy - outerR} A ${outerR} ${outerR} 0 1 1 ${cx - 0.01} ${cy - outerR} L ${cx - 0.01} ${cy - innerR} A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR} Z`,
          fraction,
          index,
        };
      }

      const x1 = cx + outerR * Math.sin(startAngle);
      const y1 = cy - outerR * Math.cos(startAngle);
      const x2 = cx + outerR * Math.sin(endAngle);
      const y2 = cy - outerR * Math.cos(endAngle);

      const ix1 = cx + innerR * Math.sin(endAngle);
      const iy1 = cy - innerR * Math.cos(endAngle);
      const ix2 = cx + innerR * Math.sin(startAngle);
      const iy2 = cy - innerR * Math.cos(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        `Z`,
      ].join(" ");

      return {
        ...group,
        d,
        fraction,
        index,
      };
    });
  }, [groupedData, totalPortfolioValue]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const activeGraphGroup =
    activeGraphIndex !== null ? groupedData[activeGraphIndex] : null;

  return (
    <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-visible h-full flex flex-col justify-between">
      <CardHeader className="flex flex-row sm:flex-row sm:items-center justify-between  px-2 sm:px-4 border-none">
        <div>
          <CardTitle className="text-md sm:text-sm  font-medium text-slate-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-slate-800 stroke-[2.25]" />
            Fund Sources
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4  relative flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : groupedData.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-10 gap-4 lg:gap-6 items-center flex-1 my-auto md:translate-x-6">
            {/* Empty Donut Ring */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[220px]">
              <div className="relative w-60 h-52 sm:w-70 sm:h-60 flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full overflow-visible"
                >
                  <circle
                    cx="50"
                    cy="70"
                    r="70"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="32"
                  />
                  <circle
                    cx="50"
                    cy="70"
                    r="70"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
                <div className="absolute flex flex-col items-center text-center p-2">
                  <Layers className="h-7 w-7 text-slate-400 mb-1" />
                  <span className="text-xs font-semibold text-slate-500">
                    No Data
                  </span>
                </div>
              </div>
            </div>

            {/* Empty Legend Placeholder */}
            <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
              <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                <p className="text-xs font-semibold text-slate-500">
                  No fund sources data available.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fund allocation metrics will appear here once configured.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center flex-1 my-auto">
            {/* SVG Pie Chart Container with Floating Tooltip OVER Graph */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative min-h-[240px] translate-x-10">
              <div
                className="relative w-60 h-56 sm:w-70 sm:h-64 flex items-center justify-center"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipCoords({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => {
                  setActiveGraphIndex(null);
                  setTooltipCoords(null);
                }}
              >
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full overflow-visible drop-shadow-xs"
                >
                  {slices.map((slice) => {
                    const isHovered = activeGraphIndex === slice.index;
                    return (
                      <path
                        key={slice.fundType}
                        d={slice.d}
                        fill={slice.color}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          transform: isHovered ? "scale(1.04)" : "scale(1)",
                          transformOrigin: "100px 100px",
                          opacity:
                            activeGraphIndex === null || isHovered ? 1 : 0.75,
                          filter: isHovered
                            ? "drop-shadow(0px 4px 10px rgba(0,0,0,0.18))"
                            : "none",
                        }}
                        onMouseEnter={() => setActiveGraphIndex(slice.index)}
                      />
                    );
                  })}
                </svg>

                {/* Floating Tooltip OVER the Graph on Hover */}
                {activeGraphGroup && tooltipCoords && (
                  <div
                    className="absolute z-30 pointer-events-none bg-white text-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 transition-all duration-100 ease-out min-w-[210px] max-w-[260px]"
                    style={{
                      left: `${Math.min(Math.max(tooltipCoords.x, 20), 220)}px`,
                      top: `${Math.max(tooltipCoords.y - 12, 10)}px`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    <div className="flex items-center justify-between bg-white border-b border-slate-100 pb-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-md flex-shrink-0"
                          style={{ backgroundColor: activeGraphGroup.color }}
                        />
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[120px]">
                          {activeGraphGroup.fundType}
                        </span>
                      </div>
                      <span className="text-[11.5px] font-extrabold text-blue-600">
                        {activeGraphGroup.aggregatePercentage.toFixed(1)}%
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-black mb-2">
                      Total:{" "}
                      <span className="font-bold text-slate-900">
                        {formatCurrency(activeGraphGroup.totalBalance)}
                      </span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      <div className="text-[10px] uppercase tracking-wider text-black font-semibold mb-1">
                        Funds ({activeGraphGroup.funds.length}):
                      </div>
                      {activeGraphGroup.funds.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-[10.5px] py-1 border-t border-slate-100"
                        >
                          <span
                            className="truncate pr-2 text-slate-700 font-medium max-w-[130px]"
                            title={f.fundName || f.fund}
                          >
                            {f.fundName || f.fund}
                          </span>
                          <span className="font-bold text-slate-900 text-right flex-shrink-0">
                            {formatCurrency(f.fundBalance)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Legend Section */}
            <div className="md:col-span-5 flex flex-col justify-end space-y-1.5 md:translate-x-[65px]">
              {groupedData.map((group, index) => {
                const isHovered = activeGraphIndex === index;

                return (
                  <div
                    key={group.fundType}
                    className={`flex items-center py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? "bg-slate-100/70" : "hover:bg-slate-50"
                    }`}
                    onMouseEnter={() => setActiveGraphIndex(index)}
                    onMouseLeave={() => setActiveGraphIndex(null)}
                  >
                    {/* Fixed-width label section */}
                    <div className="flex items-center gap-3 w-[100px] min-w-[100px]">
                      <span
                        className="h-3.5 w-3.5 rounded-md flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />

                      <span
                        className="text-[11px] text-slate-700 sm:text-slate-800 truncate"
                        title={group.fundType}
                      >
                        {group.fundType}
                      </span>
                    </div>

                    {/* Percentage */}
                    <div className="text-[11px] text-slate-900 flex-shrink-0">
                      {group.aggregatePercentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
