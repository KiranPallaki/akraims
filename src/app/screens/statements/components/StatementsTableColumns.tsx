import React, { useMemo, useState } from "react";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { StatementItem, StatementsTabType } from "../types";
import {
  FileText,
  ExternalLink,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Layers,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import TextFilterPopover, {
  TextFilterValue,
} from "@/components/common/TextFilterPopover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import StandardDatePicker from "@/components/common/StandardDatePicker";

// Text filter matching function
const textFilterFn: FilterFn<StatementItem> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const { value, mode } = filterValue as TextFilterValue;
  if (!value || value.trim() === "") return true;

  const rawCell = String(row.getValue(columnId) ?? "").toLowerCase();
  const search = String(value).trim().toLowerCase();

  switch (mode) {
    case "startsWith":
      return rawCell.startsWith(search);
    case "endsWith":
      return rawCell.endsWith(search);
    case "equals":
      return rawCell === search;
    case "contains":
    default:
      return rawCell.includes(search);
  }
};

// Set filter matching function for Statement Type
const setFilterFn: FilterFn<StatementItem> = (row, columnId, filterValue) => {
  if (!filterValue || filterValue === "ALL") return true;
  const rawCell = String(row.getValue(columnId) ?? "").trim();
  return rawCell.toLowerCase() === String(filterValue).trim().toLowerCase();
};

// Date filter function
const dateFilterFn: FilterFn<StatementItem> = (row, columnId, filterValue) => {
  if (!filterValue) return true;
  const rawCell = String(row.getValue(columnId) ?? "").trim();
  if (!rawCell) return false;
  const formattedRaw = formatDate(rawCell);
  const formattedFilter = formatDate(filterValue);
  return formattedRaw === formattedFilter || rawCell.includes(filterValue);
};

interface UseStatementsColumnsOptions {
  activeTab: StatementsTabType;
  availableTypes?: string[];
}

export function useStatementsColumns({
  activeTab,
  availableTypes = [],
}: UseStatementsColumnsOptions): ColumnDef<StatementItem>[] {
  const [activePopoverCol, setActivePopoverCol] = useState<string | null>(null);

  return useMemo(() => {
    const cols: ColumnDef<StatementItem>[] = [];

    // 1. Admin Statements extra columns: Fund & Participant Name
    if (activeTab === "adminStatements") {
      cols.push({
        id: "fund",
        accessorFn: (row) => row.fund || "-",
        filterFn: textFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as TextFilterValue | null;
          const isFiltered = !!(filterValue && filterValue.value);

          return (
            <div className="flex items-center justify-between gap-1 py-1 pr-2">
              <button
                type="button"
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`flex items-center gap-1.5 text-[12px] font-normal tracking-wide transition-colors select-none text-left ${
                  isSorted
                    ? "text-[#051a36]"
                    : "text-slate-800 hover:text-[#051a36]"
                }`}
                title="Sort Fund Name (3-step: asc, desc, clear)"
              >
                <span>Fund</span>
                {isSorted === "asc" && (
                  <ArrowUp className="h-3 w-3 text-[#051a36]" />
                )}
                {isSorted === "desc" && (
                  <ArrowDown className="h-3 w-3 text-[#051a36]" />
                )}
                {!isSorted && (
                  <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActivePopoverCol(
                      activePopoverCol === "fund" ? null : "fund",
                    )
                  }
                  className={`p-1 rounded-md transition-colors ${
                    isFiltered
                      ? "bg-[#051a36]/10 text-[#051a36]"
                      : "hover:bg-slate-200/60 hover:text-slate-600"
                  }`}
                  title="Filter Fund"
                >
                  <Filter className="h-3 w-3" />
                </button>
                {activePopoverCol === "fund" && (
                  <TextFilterPopover
                    columnTitle="Fund"
                    initialFilter={filterValue}
                    onApply={(val) => column.setFilterValue(val)}
                    onClose={() => setActivePopoverCol(null)}
                  />
                )}
              </div>
            </div>
          );
        },
        cell: ({ row }) => (
          <span
            className="text-slate-800 truncate block max-w-[180px] text-[12px] font-normal"
            title={row.original.fund || "-"}
          >
            {row.original.fund || "-"}
          </span>
        ),
      });

      cols.push({
        id: "participantName",
        accessorFn: (row) => row.participantName || "-",
        filterFn: textFilterFn,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          const filterValue = column.getFilterValue() as TextFilterValue | null;
          const isFiltered = !!(filterValue && filterValue.value);

          return (
            <div className="flex items-center justify-between gap-1 py-1 pr-2">
              <button
                type="button"
                onClick={() => {
                  if (!isSorted) column.toggleSorting(false);
                  else if (isSorted === "asc") column.toggleSorting(true);
                  else column.clearSorting();
                }}
                className={`flex items-center gap-1.5 text-[12px] font-normal tracking-wide transition-colors select-none text-left ${
                  isSorted
                    ? "text-[#051a36]"
                    : "text-slate-800 hover:text-[#051a36]"
                }`}
                title="Sort Participant Name (3-step: asc, desc, clear)"
              >
                <span>Participant Name</span>
                {isSorted === "asc" && (
                  <ArrowUp className="h-3 w-3 text-[#051a36]" />
                )}
                {isSorted === "desc" && (
                  <ArrowDown className="h-3 w-3 text-[#051a36]" />
                )}
                {!isSorted && (
                  <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
                )}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActivePopoverCol(
                      activePopoverCol === "participantName"
                        ? null
                        : "participantName",
                    )
                  }
                  className={`p-1 rounded-md transition-colors ${
                    isFiltered
                      ? "bg-[#051a36]/10 text-[#051a36]"
                      : "text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  }`}
                  title="Filter Participant Name"
                >
                  <Filter className="h-3 w-3" />
                </button>
                {activePopoverCol === "participantName" && (
                  <TextFilterPopover
                    columnTitle="Participant Name"
                    initialFilter={filterValue}
                    onApply={(val) => column.setFilterValue(val)}
                    onClose={() => setActivePopoverCol(null)}
                  />
                )}
              </div>
            </div>
          );
        },
        cell: ({ row }) => (
          <span
            className="text-slate-800 truncate block max-w-[200px] text-[12px] font-normal"
            title={row.original.participantName || "-"}
          >
            {row.original.participantName || "-"}
          </span>
        ),
      });
    }

    // 2. Common Name Column
    cols.push({
      id: "name",
      accessorFn: (row) => row.name || "",
      filterFn: textFilterFn,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        const filterValue = column.getFilterValue() as TextFilterValue | null;
        const isFiltered = !!(filterValue && filterValue.value);

        return (
          <div className="flex items-center justify-between gap-1 py-1 pr-2">
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`flex items-center gap-1.5 text-[12px] font-normal tracking-wide transition-colors select-none text-left ${
                isSorted
                  ? "text-[#051a36]"
                  : "text-slate-800 hover:text-[#051a36]"
              }`}
              title="Sort Name (3-step: asc, desc, clear)"
            >
              <span>Name</span>
              {isSorted === "asc" && (
                <ArrowUp className="h-3 w-3 text-[#051a36]" />
              )}
              {isSorted === "desc" && (
                <ArrowDown className="h-3 w-3 text-[#051a36]" />
              )}
              {!isSorted && (
                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
              )}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopoverCol(
                    activePopoverCol === "name" ? null : "name",
                  )
                }
                className={`p-1 rounded-md transition-colors ${
                  isFiltered
                    ? "bg-[#051a36]/10 text-[#051a36]"
                    : "text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                }`}
                title="Filter Name"
              >
                <Filter className="h-3 w-3" />
              </button>
              {activePopoverCol === "name" && (
                <TextFilterPopover
                  columnTitle="Name"
                  initialFilter={filterValue}
                  onApply={(val) => column.setFilterValue(val)}
                  onClose={() => setActivePopoverCol(null)}
                />
              )}
            </div>
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="text-slate-800 truncate max-w-[220px] text-[12px] font-normal"
            title={row.original.name}
          >
            {row.original.name || "-"}
          </span>
        </div>
      ),
    });

    // 3. Statement Type Column (field: type / statementType)
    cols.push({
      id: "type",
      accessorFn: (row) => row.type || row.statementType || "",
      filterFn: setFilterFn,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        const filterValue = (column.getFilterValue() as string) || "ALL";
        const isFiltered = filterValue !== "ALL";

        return (
          <div className="flex items-center justify-between gap-1 py-1 pr-2">
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`flex items-center gap-1.5 text-[12px] font-normal tracking-wide transition-colors select-none text-left ${
                isSorted
                  ? "text-[#051a36]"
                  : "text-slate-800 hover:text-[#051a36]"
              }`}
              title="Sort Statement Type (3-step: asc, desc, clear)"
            >
              <span>Statement Type</span>
              {isSorted === "asc" && (
                <ArrowUp className="h-3 w-3 text-[#051a36]" />
              )}
              {isSorted === "desc" && (
                <ArrowDown className="h-3 w-3 text-[#051a36]" />
              )}
              {!isSorted && (
                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
              )}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`p-1 rounded-md transition-colors ${
                    isFiltered
                      ? "bg-[#051a36]/10 text-[#051a36]"
                      : "text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  }`}
                  title="Filter Statement Type"
                >
                  <Filter className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3 bg-white border border-slate-200 shadow-xl rounded-xl text-[12px] font-normal">
                <div className="font-normal text-slate-800 mb-2 flex items-center justify-between border-b pb-1.5 text-[12px]">
                  <span className="flex items-center text-[12px] font-normal gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#051a36]" />
                    Statement Type
                  </span>
                  {isFiltered && (
                    <button
                      onClick={() => column.setFilterValue("ALL")}
                      className="text-[12px] text-[#051a36] hover:underline font-normal"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => column.setFilterValue("ALL")}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-normal transition-colors ${
                      filterValue === "ALL"
                        ? "bg-[#051a36]/10 text-[#051a36]"
                        : "hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    All Types
                  </button>
                  {availableTypes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => column.setFilterValue(t)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-normal transition-colors ${
                        filterValue === t
                          ? "bg-[#051a36]/10 text-[#051a36]"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      cell: ({ row }) => {
        const typeStr =
          row.original.type || row.original.statementType || "Standard";
        return (
          <span className="inline-flex items-center text-slate-700 text-[12px] font-normal">
            {typeStr}
          </span>
        );
      },
    });

    // 4. Date Column
    cols.push({
      id: "date",
      accessorFn: (row) => row.date || "",
      filterFn: dateFilterFn,
      header: ({ column }) => {
        const isSorted = column.getIsSorted();
        const filterValue = (column.getFilterValue() as string) || "";
        const isFiltered = !!filterValue;

        return (
          <div className="flex items-center justify-between gap-1 py-1 pr-2">
            <button
              type="button"
              onClick={() => {
                if (!isSorted) column.toggleSorting(false);
                else if (isSorted === "asc") column.toggleSorting(true);
                else column.clearSorting();
              }}
              className={`flex items-center gap-1.5 text-[12px] font-normal tracking-wide transition-colors select-none text-left ${
                isSorted
                  ? "text-[#051a36]"
                  : "text-slate-800 hover:text-[#051a36]"
              }`}
              title="Sort Date (3-step: asc, desc, clear)"
            >
              <span>Date</span>
              {isSorted === "asc" && (
                <ArrowUp className="h-3 w-3 text-[#051a36]" />
              )}
              {isSorted === "desc" && (
                <ArrowDown className="h-3 w-3 text-[#051a36]" />
              )}
              {!isSorted && (
                <ArrowUpDown className="h-3 w-3 opacity-40 hover:opacity-100" />
              )}
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`p-1 rounded-md transition-colors ${
                    isFiltered
                      ? "bg-[#051a36]/10 text-[#051a36]"
                      : "text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
                  }`}
                  title="Filter Date"
                >
                  <Filter className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-white border border-slate-200 shadow-xl rounded-xl text-[12px] font-normal">
                <div className="font-normal text-slate-800 mb-2 flex items-center justify-between border-b pb-1.5 text-[12px]">
                  <span className="flex items-center gap-1.5 text-[12px] font-normal">
                    <Calendar className="h-3.5 w-3.5 text-[#051a36]" />
                    Filter Date
                  </span>
                  {isFiltered && (
                    <button
                      onClick={() => column.setFilterValue("")}
                      className="text-[12px] text-[#051a36] hover:underline font-normal"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <StandardDatePicker
                  value={filterValue}
                  onChange={(val) => column.setFilterValue(val)}
                  placeholder="Select Date (MM/DD/YYYY)"
                />
              </PopoverContent>
            </Popover>
          </div>
        );
      },
      cell: ({ row }) => {
        const rawDate = row.original.date || "";
        const formatted = rawDate ? formatDate(rawDate) : "-";
        return <span className="text-slate-600 text-[12px] font-normal">{formatted}</span>;
      },
    });

    // 5. Statement Column (custom View/ Download link renderer)
    cols.push({
      id: "statement",
      header: () => (
        <div className="text-center text-[12px] font-normal text-slate-800">
          Statement
        </div>
      ),
      cell: ({ row }) => {
        const filePath = row.original.filePath;
        const hasValidPath =
          typeof filePath === "string" && filePath.trim() !== "";

        if (!hasValidPath) {
          return (
            <div className="text-center">
              <span className="text-slate-400 text-[12px] italic font-normal">Unavailable</span>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center">
            <a
              href={filePath}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[12px] font-normal text-[#051a36] hover:underline"
              title={`Open ${filePath}`}
            >
              <span>View/ Download</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        );
      },
    });

    return cols;
  }, [activeTab, availableTypes, activePopoverCol]);
}
