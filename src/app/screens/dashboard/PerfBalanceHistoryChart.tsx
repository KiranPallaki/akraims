"use client";

import React, { useState, useMemo } from "react";
import { PerfBalanceHistoryItem } from "@/types/dashboard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Layers } from "lucide-react";

interface PerfBalanceHistoryChartProps {
  items: PerfBalanceHistoryItem[];
  isLoading?: boolean;
}

type TimeRange = "MTD" | "3M" | "6M" | "YTD" | "1Y" | "YEAR";

function formatOrdinalDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthName = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(-2);

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${monthName} ${day}${suffix} '${year}`;
}

function formatXAxisDate(dateStr?: string, totalPoints: number = 12): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const monthName = date.toLocaleString("en-US", { month: "short" });
  const year = String(date.getFullYear()).slice(-2);

  if (totalPoints > 6) {
    return `${monthName} '${year}`;
  }
  const day = date.getDate();
  return `${monthName} ${day} '${year}`;
}

const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export default function PerfBalanceHistoryChart({
  items = [],
  isLoading = false,
}: PerfBalanceHistoryChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1Y");
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const availableYears = useMemo(() => {
    const years = items
      .map((item) => new Date(item.transactionDate ?? 0).getFullYear())
      .filter((year) => year > 1970);

    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [items]);

  // Chronologically sorted items across all years
  const allSorted = useMemo(() => {
    if (!items || items.length === 0) return [];
    return [...items]
      .filter((item) => item.transactionDate)
      .sort(
        (a, b) =>
          new Date(a.transactionDate ?? 0).getTime() -
          new Date(b.transactionDate ?? 0).getTime(),
      );
  }, [items]);

  // Filter items based on selected time range (Default "1Y" = 1 year back from today/latest date, e.g. Oct 2025 to Oct 2026)
  const filteredData = useMemo(() => {
    if (allSorted.length === 0) return [];

    const latestItemDate = new Date(
      allSorted[allSorted.length - 1].transactionDate!,
    );

    switch (timeRange) {
      case "MTD":
        return allSorted.slice(-1);
      case "3M":
        return allSorted.slice(-3);
      case "6M":
        return allSorted.slice(-6);
      case "YTD": {
        const latestYear = latestItemDate.getFullYear();
        return allSorted.filter(
          (i) => new Date(i.transactionDate ?? 0).getFullYear() === latestYear,
        );
      }
      case "YEAR": {
        return allSorted.filter(
          (i) =>
            new Date(i.transactionDate ?? 0).getFullYear() === selectedYear,
        );
      }
      case "1Y":
      default: {
        // 1Y (default filter): From latest date back 1 year (12 months), e.g., Oct 2025 to Oct 2026
        const oneYearAgo = new Date(latestItemDate);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const inRange = allSorted.filter(
          (i) => new Date(i.transactionDate ?? 0) >= oneYearAgo,
        );
        return inRange.length > 0 ? inRange : allSorted.slice(-12);
      }
    }
  }, [allSorted, timeRange, selectedYear]);

  // Scaler Calculations for SVG Chart
  const chartWidth = 720;
  const chartHeight = 280;
  const margin = { top: 25, right: 65, bottom: 50, left: 55 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  // Max Market Value for Right Y-Axis ($)
  const maxMarketValue = useMemo(() => {
    if (filteredData.length === 0) return 3000000;
    const maxVal = Math.max(
      ...filteredData.map((d) => Number(d.marketValue ?? 0)),
    );
    return Math.ceil((maxVal * 1.15) / 500000) * 500000 || 3000000;
  }, [filteredData]);

  // Min and Max Rate of Return for Left Y-Axis (%)
  const { minPerf, maxPerf } = useMemo(() => {
    if (filteredData.length === 0) return { minPerf: -5, maxPerf: 7.5 };
    const perfs = filteredData.map((d) => Number(d.rateOfReturn ?? 0));
    const minVal = Math.min(...perfs);
    const maxVal = Math.max(...perfs);

    const minP = Math.floor(Math.min(minVal, -5) / 2.5) * 2.5;
    const maxP = Math.ceil(Math.max(maxVal, 7.5) / 2.5) * 2.5;

    return { minPerf: minP, maxPerf: maxP };
  }, [filteredData]);

  // Y Grid Ticks (6 evenly spaced levels)
  const yTicksCount = 5;
  const gridLevels = useMemo(() => {
    const levels = [];
    for (let i = 0; i <= yTicksCount; i++) {
      const ratio = i / yTicksCount;
      const perfVal = maxPerf - ratio * (maxPerf - minPerf);
      const valMarket = maxMarketValue - ratio * maxMarketValue;
      const yPos = margin.top + ratio * innerHeight;
      levels.push({ perfVal, valMarket, yPos });
    }
    return levels;
  }, [maxPerf, minPerf, maxMarketValue, innerHeight, margin.top]);

  // Calculate Bar & Point Positions
  const points = useMemo(() => {
    if (filteredData.length === 0) return [];
    const count = filteredData.length;
    const step = count > 1 ? innerWidth / (count - 1) : innerWidth / 2;

    return filteredData.map((item, idx) => {
      const x =
        count === 1 ? margin.left + innerWidth / 2 : margin.left + idx * step;

      // Y Position for Market Value Bar (Bottom-up)
      const mvRatio = Math.min(
        1,
        Math.max(0, Number(item.marketValue ?? 0) / maxMarketValue),
      );
      const barHeight = mvRatio * innerHeight;
      const barY = margin.top + innerHeight - barHeight;

      // Y Position for Performance Line
      const perfRatio =
        maxPerf === minPerf
          ? 0.5
          : (maxPerf - Number(item.rateOfReturn ?? 0)) / (maxPerf - minPerf);
      const lineY = margin.top + perfRatio * innerHeight;

      return {
        item,
        idx,
        x,
        barY,
        barHeight,
        lineY,
        dateLabel: formatOrdinalDate(item.transactionDate),
      };
    });
  }, [
    filteredData,
    innerWidth,
    innerHeight,
    margin,
    maxMarketValue,
    maxPerf,
    minPerf,
  ]);

  // Build Smooth Cubic Bezier Path for Performance Line
  const linePathD = useMemo(() => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].lineY}`;

    let path = `M ${points[0].x} ${points[0].lineY}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const controlX = (curr.x + next.x) / 2;
      path += ` C ${controlX} ${curr.lineY}, ${controlX} ${next.lineY}, ${next.x} ${next.lineY}`;
    }
    return path;
  }, [points]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <Card className="border border-slate-200/80 bg-white shadow-xs rounded-2xl overflow-visible h-full flex flex-col justify-between">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between  px-2 sm:px-4  border-none ">
        <div>
          <CardTitle className="text-md sm:text-sm  font-medium text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-slate-800 stroke-[2.25]" />
            Performance & Balance History
          </CardTitle>
        </div>

        {/* Time Range Selector Buttons [ MTD | 3M | 6M | YTD | 1Y ] */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* NEW: Year Selection */}

          {/* EXISTING TIME RANGE SELECTOR */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/80 p-0.5 ">
            {(["MTD", "3M", "6M", "YTD", "1Y"] as TimeRange[]).map((range) => {
              const isActive = timeRange === range;

              return (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  {range}
                </button>
              );
            })}
          </div>
          <select
            value={timeRange === "YEAR" ? selectedYear : ""}
            onChange={(e) => {
              const yr = Number(e.target.value);
              if (yr) {
                setSelectedYear(yr);
                setTimeRange("YEAR");
              }
            }}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50/80 px-2 text-xs font-semibold text-slate-600 outline-none cursor-pointer"
          >
            <option value="" disabled hidden>
              Select Year
            </option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-4  relative flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-slate-400">
            <Layers className="h-10 w-10 stroke-1 mb-2" />
            <p className="text-sm font-medium">
              No performance balance data available.
            </p>
          </div>
        ) : (
          <div className="relative w-full flex flex-col items-center">
            {/* SVG Chart Container */}
            <div
              className="relative w-full overflow-visible"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipCoords({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
              }}
              onMouseLeave={() => {
                setHoveredIdx(null);
                setTooltipCoords(null);
              }}
            >
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible select-none"
              >
                {/* Horizontal Grid Lines */}
                {gridLevels.map((lvl, i) => (
                  <g key={i}>
                    <line
                      x1={margin.left}
                      y1={lvl.yPos}
                      x2={chartWidth - margin.right}
                      y2={lvl.yPos}
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />

                    {/* Left Y-Axis Label (% Performance) */}
                    <text
                      x={margin.left - 10}
                      y={lvl.yPos + 4}
                      textAnchor="end"
                      className="fill-slate-500 font-semibold text-[9px]"
                    >
                      {lvl.perfVal.toFixed(1)}%
                    </text>

                    {/* Right Y-Axis Label ($ Market Value) */}
                    <text
                      x={chartWidth - margin.right + 10}
                      y={lvl.yPos + 4}
                      textAnchor="start"
                      className="fill-slate-500 font-semibold text-[9px]"
                    >
                      ${(lvl.valMarket / 1000000).toFixed(2)}M
                    </text>
                  </g>
                ))}

                {/* Vertical Axis Titles */}
                <text
                  x={10}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90, 10, ${chartHeight / 2})`}
                  className="fill-slate-400 font-semibold text-[9px] uppercase tracking-wider"
                >
                  Performance
                </text>
                <text
                  x={chartWidth - 10}
                  y={chartHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(90, ${chartWidth - 10}, ${chartHeight / 2})`}
                  className="fill-slate-400 font-semibold text-[9px] uppercase tracking-wider"
                >
                  Market Value
                </text>

                {/* BARS: Market Value (#051a36) */}
                {points.map((pt) => {
                  const barW = Math.max(
                    3,
                    Math.min(4.5, innerWidth / (points.length * 7)),
                  );
                  const isHovered = hoveredIdx === pt.idx;

                  return (
                    <rect
                      key={`bar-${pt.idx}`}
                      x={pt.x - barW / 2}
                      y={pt.barY}
                      width={barW}
                      height={pt.barHeight}
                      fill="#051a36"
                      rx="2"
                      ry="2"
                      className="transition-all duration-150 cursor-pointer hover:opacity-90"
                      style={{
                        opacity: hoveredIdx === null || isHovered ? 1 : 0.65,
                      }}
                      onMouseEnter={() => setHoveredIdx(pt.idx)}
                    />
                  );
                })}

                {/* LINE: Rate of Return (#90191b) */}
                <path
                  d={linePathD}
                  fill="none"
                  stroke="#90191b"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  className="drop-shadow-xs"
                />

                {/* X-Axis Date Labels */}
                {points.map((pt) => {
                  const isHovered = hoveredIdx === pt.idx;
                  const labelText = formatXAxisDate(
                    pt.item.transactionDate,
                    points.length,
                  );

                  return (
                    <g key={`x-${pt.idx}`}>
                      <text
                        x={pt.x}
                        y={chartHeight - margin.bottom + 18}
                        textAnchor="middle"
                        className={`text-[8.5px] transition-colors cursor-pointer ${
                          isHovered
                            ? "fill-blue-600 font-extrabold text-[9.5px]"
                            : "fill-slate-600 font-medium"
                        }`}
                        onMouseEnter={() => setHoveredIdx(pt.idx)}
                      >
                        {labelText}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip ON Hover */}
              {activePoint && tooltipCoords && (
                <div
                  className="absolute z-30 pointer-events-none bg-white text-slate-900 p-3 rounded-xl shadow-xl border border-slate-200 transition-all duration-75 ease-out min-w-[190px]"
                  style={{
                    left: `${Math.min(Math.max(tooltipCoords.x, 90), chartWidth - 90)}px`,
                    top: `${Math.max(tooltipCoords.y - 10, 10)}px`,
                    transform: "translate(-50%, -100%)",
                  }}
                >
                  <div className="font-bold text-xs text-slate-900 border-b border-slate-100 pb-1.5 mb-1.5">
                    {activePoint.dateLabel}
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm bg-[#051a36]" />
                        <span className="text-slate-600 font-medium">
                          Balance:
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(
                          Number(activePoint.item.marketValue ?? 0),
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#90191b]" />
                        <span className="text-slate-600 font-medium">
                          Performance:
                        </span>
                      </div>
                      <span
                        className={`font-extrabold ${
                          Number(activePoint.item.rateOfReturn ?? 0) >= 0
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {Number(activePoint.item.rateOfReturn ?? 0) >= 0
                          ? "+"
                          : ""}
                        {Number(activePoint.item.rateOfReturn ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-slate-100 w-full text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#051a36]" />
                <span>Balance</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-[#90191b] rounded-full" />
                <span>Performance</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
