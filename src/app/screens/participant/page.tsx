"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import {
  ParticipantItem,
  ParticipantFormValues,
  AddParticipantPayload,
  UpdateParticipantPayload,
} from "./types";
import {
  fetchParticipantList,
  fetchFundOptions,
  submitAddParticipant,
  submitUpdateParticipant,
} from "./api";
import { useParticipantColumns } from "./components/ParticipantTableColumns";
import AddParticipantDrawer from "./components/AddParticipantDrawer";
import DeleteParticipantModal from "./components/DeleteParticipantModal";
import SearchBar from "@/components/common/SearchBar";
import ReusableTable from "@/components/common/ReusableTable";
import { exportTableToPDF } from "@/lib/pdfExport";
import { formatDate } from "@/lib/dateUtils";
import { Plus, RotateCw, FileSpreadsheet, FileText, Users } from "lucide-react";

export default function ParticipantPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Local state changes to update the grid immediately
  const [localParticipants, setLocalParticipants] = useState<ParticipantItem[]>([]);
  const [deletedParticipantIds, setDeletedParticipantIds] = useState<(number | string)[]>([]);

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<ParticipantItem | null>(null);
  const [deleteModalParticipant, setDeleteModalParticipant] = useState<ParticipantItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  // Query participants
  const {
    data: queryResult,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["participantList", clientID],
    queryFn: () => fetchParticipantList(clientID),
    staleTime: 1000 * 60 * 3,
  });

  // Query fund options for association
  const { data: fundOptions = [] } = useQuery({
    queryKey: ["participantFundOptions", clientID],
    queryFn: () => fetchFundOptions(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const rawParticipants = queryResult?.data || [];

  // Merge server participants with local state
  const allParticipants = useMemo(() => {
    const combined = [...localParticipants, ...rawParticipants];
    const uniqueMap = new Map<string | number, ParticipantItem>();
    combined.forEach((item) => {
      if (!deletedParticipantIds.includes(item.participantID)) {
        uniqueMap.set(item.participantID, item);
      }
    });
    return Array.from(uniqueMap.values());
  }, [localParticipants, rawParticipants, deletedParticipantIds]);

  // Apply Global SearchBar filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return allParticipants;
    const q = searchQuery.toLowerCase();
    return allParticipants.filter((item) => {
      return (
        (item.participantName || "").toLowerCase().includes(q) ||
        (item.participantType || "").toLowerCase().includes(q) ||
        (item.status || "").toLowerCase().includes(q) ||
        (item.openDate || "").toLowerCase().includes(q)
      );
    });
  }, [allParticipants, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingParticipant(null);
    setApiError(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (participant: ParticipantItem) => {
    setEditingParticipant(participant);
    setApiError(null);
    setIsDrawerOpen(true);
  };

  const handleDelete = (participant: ParticipantItem) => {
    setDeleteModalParticipant(participant);
  };

  const handleDeleteSuccess = (id: number | string) => {
    setDeletedParticipantIds((prev) => [...prev, id]);
    setDeleteModalParticipant(null);
    refetch();
  };

  const handleDrawerSubmit = async (
    values: ParticipantFormValues,
    initialFundIds: (number | string)[]
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setApiError(null);

    const statusStr = values.isActive ? "Active" : "Inactive";

    if (editingParticipant) {
      // Edit Flow
      const addFundIds = values.selectedFundIds.filter(
        (id) => !initialFundIds.includes(id)
      );
      const removeFundIds = initialFundIds.filter(
        (id) => !values.selectedFundIds.includes(id)
      );

      const payload: UpdateParticipantPayload = {
        participantName: values.participantName,
        participantType: values.participantType,
        status: statusStr,
        isActive: values.isActive,
        openDate: values.openDate,
        closeDate: values.closeDate || null,
        addFundIds,
        removeFundIds,
      };

      const res = await submitUpdateParticipant(
        editingParticipant.participantID,
        payload,
        clientID
      );

      if (!res.ok) {
        setIsSubmitting(false);
        setApiError(res.message || "Failed to update participant.");
        return false;
      }

      const updatedItem: ParticipantItem = {
        ...editingParticipant,
        participantName: values.participantName,
        participantType: values.participantType,
        status: statusStr,
        openDate: values.openDate,
        closeDate: values.closeDate || null,
        fundID: [...values.selectedFundIds],
      };

      setLocalParticipants((prev) =>
        prev.map((p) =>
          p.participantID === editingParticipant.participantID ? updatedItem : p
        )
      );
    } else {
      // Create Flow
      const payload: AddParticipantPayload = {
        participantNumber: values.participantNumber,
        participantName: values.participantName,
        participantType: values.participantType,
        status: statusStr,
        isActive: values.isActive,
        openDate: values.openDate,
        closeDate: values.closeDate || null,
        addFundIds: [...values.selectedFundIds],
        removeFundIds: [],
      };

      const res = await submitAddParticipant(payload, clientID);
      if (!res.ok) {
        setIsSubmitting(false);
        setApiError(res.message || "Failed to add participant.");
        return false;
      }

      const newParticipant: ParticipantItem = {
        participantID: `temp_${Date.now()}`,
        participantNumber: values.participantNumber,
        participantName: values.participantName,
        participantType: values.participantType,
        status: statusStr,
        openDate: values.openDate,
        closeDate: values.closeDate || null,
        fundID: [...values.selectedFundIds],
      };

      setLocalParticipants((prev) => [newParticipant, ...prev]);
    }

    setIsSubmitting(false);
    setIsDrawerOpen(false);
    setEditingParticipant(null);
    refetch();
    return true;
  };

  // Export handlers
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const headers = ["Participant Name", "Participant Type", "Status", "Open Date", "Close Date"];
    const rows = filteredData.map((p) => [
      `"${(p.participantName || "").replace(/"/g, '""')}"`,
      `"${(p.participantType || "").replace(/"/g, '""')}"`,
      `"${(p.status || "").replace(/"/g, '""')}"`,
      `"${p.openDate ? formatDate(p.openDate) : ""}"`,
      `"${p.closeDate ? formatDate(p.closeDate) : "--"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Participant_List_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const headers = ["Participant Name", "Participant Type", "Status", "Open Date", "Close Date"];
    const rows = filteredData.map((p) => [
      p.participantName || "-",
      p.participantType || "-",
      p.status || "Active",
      p.openDate ? formatDate(p.openDate) : "-",
      p.closeDate ? formatDate(p.closeDate) : "--",
    ]);

    exportTableToPDF({
      fileName: `Participant_List_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "Participant Directory",
      subtitle: `AKRA IMS - ${client?.clientName || "Selected Client"}`,
      headers,
      rows,
      orientation: "landscape",
    });
  };

  const columns = useParticipantColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  return (
    <div className="space-y-4">
      {/* Page Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end">
        

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 rounded-md bg-portal-navy px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
          >
            <Plus size={16} /> Add Participant
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar: Search & Export Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          {/* SearchBar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search participants..."
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
          </div>
        </div>

        {/* Data Table with Sorting */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={filteredData}
            isLoading={isLoading}
             enablePagination={false}
            emptyMessage="No participants found."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>
      </div>

      {/* Add / Edit Drawer */}
      <AddParticipantDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingParticipant(null);
        }}
        onSubmit={handleDrawerSubmit}
        initialData={editingParticipant}
        fundOptions={fundOptions}
        isSubmitting={isSubmitting}
        apiError={apiError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteParticipantModal
        isOpen={Boolean(deleteModalParticipant)}
        item={deleteModalParticipant}
        onClose={() => setDeleteModalParticipant(null)}
        onSuccess={handleDeleteSuccess}
        clientID={clientID}
      />
    </div>
  );
}
