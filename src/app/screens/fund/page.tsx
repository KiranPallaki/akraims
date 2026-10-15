"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { FundItem, FundFormValues } from "./types";
import { fetchFundList, submitAddFund, submitUpdateFund } from "./api";
import { useFundColumns } from "./components/FundTableColumns";
import AddFundDrawer from "./components/AddFundDrawer";
import DeleteFundModal from "./components/DeleteFundModal";
import SearchBar from "@/components/common/SearchBar";
import ReusableTable from "@/components/common/ReusableTable";
import { exportTableToPDF } from "@/lib/pdfExport";
import {
  Plus,
  RotateCw,
  FileSpreadsheet,
  FileText,
  Layers,
} from "lucide-react";

export default function FundPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Local state additions/modifications to reflect changes immediately
  const [localFunds, setLocalFunds] = useState<FundItem[]>([]);
  const [deletedFundIds, setDeletedFundIds] = useState<(number | string)[]>([]);

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<FundItem | null>(null);
  const [deleteModalFund, setDeleteModalFund] = useState<FundItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  const {
    data: queryResult,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["fundList", clientID],
    queryFn: () => fetchFundList(clientID),
    staleTime: 1000 * 60 * 3,
  });

  const rawFunds = queryResult?.data || [];

  // Merge server data with local changes
  const allFunds = useMemo(() => {
    const combined = [...localFunds, ...rawFunds];
    const uniqueMap = new Map<string | number, FundItem>();
    combined.forEach((item) => {
      if (!deletedFundIds.includes(item.fundID)) {
        uniqueMap.set(item.fundID, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [localFunds, rawFunds, deletedFundIds]);

  // Apply Global SearchBar filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return allFunds;
    const q = searchQuery.toLowerCase();
    return allFunds.filter((item) => {
      return (
        (item.fund || "").toLowerCase().includes(q) ||
        (item.fundName || "").toLowerCase().includes(q) ||
        (item.fundType || "").toLowerCase().includes(q) ||
        (item.accountType || "").toLowerCase().includes(q)
      );
    });
  }, [allFunds, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingFund(null);
    setApiError(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (fund: FundItem) => {
    setEditingFund(fund);
    setApiError(null);
    setIsDrawerOpen(true);
  };

  const handleDelete = (fund: FundItem) => {
    setDeleteModalFund(fund);
  };

  const handleDeleteSuccess = (id: number | string) => {
    setDeletedFundIds((prev) => [...prev, id]);
    setDeleteModalFund(null);
    refetch();
  };

  const handleDrawerSubmit = async (
    values: FundFormValues,
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setApiError(null);

    if (editingFund) {
      // Edit flow
      const res = await submitUpdateFund(editingFund.fundID, values, clientID);
      if (!res.ok) {
        setIsSubmitting(false);
        setApiError(res.message || "Failed to update fund.");
        return false;
      }

      const updatedItem: FundItem = {
        ...editingFund,
        ...values,
      };

      setLocalFunds((prev) =>
        prev.map((f) => (f.fundID === editingFund.fundID ? updatedItem : f)),
      );
    } else {
      // Add flow
      const res = await submitAddFund(values, clientID);
      if (!res.ok) {
        setIsSubmitting(false);
        setApiError(res.message || "Failed to add fund.");
        return false;
      }

      const newFund: FundItem = {
        fundID: `temp_${Date.now()}`,
        ...values,
      };

      setLocalFunds((prev) => [newFund, ...prev]);
    }

    setIsSubmitting(false);
    setIsDrawerOpen(false);
    setEditingFund(null);
    refetch();
    return true;
  };

  // Export handlers
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const headers = [
      "Fund",
      "Fund Type",
      "Fund Name",
      "Amount",
      "Account Type",
      "Open Date",
    ];
    const rows = filteredData.map((f) => [
      `"${(f.fund || "").replace(/"/g, '""')}"`,
      `"${(f.fundType || "").replace(/"/g, '""')}"`,
      `"${(f.fundName || "").replace(/"/g, '""')}"`,
      `"${f.amount ?? ""}"`,
      `"${(f.accountType || "").replace(/"/g, '""')}"`,
      `"${(f.openDate || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Fund_List_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const headers = [
      "Fund",
      "Fund Type",
      "Fund Name",
      "Amount",
      "Account Type",
    ];
    const rows = filteredData.map((f) => [
      f.fund || "-",
      f.fundType || "-",
      f.fundName || "-",
      f.amount ? String(f.amount) : "-",
      f.accountType || "-",
    ]);

    exportTableToPDF({
      fileName: `Fund_List_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "Fund Directory",
      subtitle: `AKRA IMS - ${client?.clientName || "Selected Client"}`,
      headers,
      rows,
      orientation: "landscape",
    });
  };

  const columns = useFundColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-4">
      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar: Search & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          {/* SearchBar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search funds..."
            className="w-full sm:w-72"
          />

          {/* Action Buttons: Export & Refresh */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to Excel / CSV"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="absolute text-[8px] font-black text-emerald-600 right-0 bottom-0 bg-white">
                  X
                </span>
              </div>
            </button>

            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to PDF"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="absolute text-[7px] font-black text-red-500 -right-1 -bottom-0.5 bg-white">
                  PDF
                </span>
              </div>
            </button>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh Data"
              type="button"
            >
              <RotateCw
                className={`h-4 w-4 text-slate-700 ${
                  isFetching ? "animate-spin text-portal-navy" : ""
                }`}
              />
            </button>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-md bg-portal-navy px-2 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
              >
                <Plus size={16} /> Add Fund
              </button>
            </div>
          </div>
        </div>

        {/* Data Table with Sorting */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
            enablePagination={false}
            emptyMessage="No funds found."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>
      </div>

      {/* Add / Edit Drawer */}
      <AddFundDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingFund(null);
        }}
        onSubmit={handleDrawerSubmit}
        initialData={editingFund}
        isSubmitting={isSubmitting}
        apiError={apiError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteFundModal
        isOpen={Boolean(deleteModalFund)}
        item={deleteModalFund}
        onClose={() => setDeleteModalFund(null)}
        onSuccess={handleDeleteSuccess}
        clientID={clientID}
      />
    </div>
  );
}
