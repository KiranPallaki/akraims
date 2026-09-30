"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { fetchTransactionsData } from "./api";
import {
  TransactionsTransactionItem,
  TransactionsTabType,
  TransactionFormValues,
} from "./types";
import SearchBar from "@/components/common/SearchBar";
import TransactionsTab from "./components/TransactionsTab";
import PendingTransactionsTab from "./components/PendingTransactionsTab";
import AddTransactionForm from "./components/AddTransactionForm";
import { FileSpreadsheet, FileText, RotateCw, Plus, X } from "lucide-react";

export default function TransactionsPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] =
    useState<TransactionsTabType>("Transactions");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [addedItems, setAddedItems] = useState<TransactionsTransactionItem[]>(
    [],
  );
  const [deletedTxnIds, setDeletedTxnIds] = useState<(number | string)[]>([]);
  const [editingTxn, setEditingTxn] =
    useState<TransactionsTransactionItem | null>(null);

  // Slide-over Drawer State for "Add / Edit Transaction"
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const selected = getSelectedClient();
    setClient(selected);
  }, []);

  const clientID = client?.clientID;

  // React TanStack Query Hook
  const {
    data: fetchedData = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["transactions", activeTab, clientID],
    queryFn: async () => {
      const res = await fetchTransactionsData<TransactionsTransactionItem>(
        activeTab,
        clientID,
      );
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  // Combine query data with local created items and filter deleted items
  const transactionsData = useMemo(() => {
    const combined = [...addedItems, ...fetchedData];
    if (deletedTxnIds.length === 0) return combined;
    return combined.filter(
      (item) => !deletedTxnIds.includes(item.transactionID),
    );
  }, [addedItems, fetchedData, deletedTxnIds]);

  const handleTabChange = (tab: TransactionsTabType) => {
    setActiveTab(tab);
    setAddedItems([]);
    setDeletedTxnIds([]);
    setEditingTxn(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleEditRow = (item: TransactionsTransactionItem) => {
    setEditingTxn(item);
    setIsAddDrawerOpen(true);
  };

  const handleDeleteRow = (item: TransactionsTransactionItem) => {
    if (
      confirm(
        `Are you sure you want to delete transaction ${item.transactionID}?`,
      )
    ) {
      setAddedItems((prev) =>
        prev.filter((i) => i.transactionID !== item.transactionID),
      );
      setDeletedTxnIds((prev) => [...prev, item.transactionID]);
    }
  };

  // CSV / Excel Export Handler
  const handleExportExcel = () => {
    if (filteredData.length === 0) return;
    const headers = [
      "Transaction ID",
      "Participant Name",
      "Fund",
      "Transaction Code",
      "Transaction Date",
      "Amount",
      "Units",
      "FeeAmount",
      "Notes",
    ];
    const csvRows = [headers.join(",")];

    filteredData.forEach((row) => {
      const id = `"${row.transactionID ?? ""}"`;
      const name = `"${(row.participantName || row.accountName || "").replace(/"/g, '""')}"`;
      const fund = `"${(row.fund || row.fundName || "").replace(/"/g, '""')}"`;
      const code = `"${(row.transactionCodeDesc || row.transactionCode || "").replace(/"/g, '""')}"`;
      const date = `"${(row.transactionDate || "").split("T")[0]}"`;
      const amt = row.transactionAmount ?? row.amount ?? 0;
      const units = row.transactionUnits ?? "";
      const fee = row.feeAmount ?? 0;
      const notes = `"${(row.notes || "").replace(/"/g, '""')}"`;

      csvRows.push(
        [id, name, fund, code, date, amt, units, fee, notes].join(","),
      );
    });

    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export Handler
  const handleExportPDF = () => {
    window.print();
  };

  // Form Submit Handler for Add/Edit Form
  const handleFormSubmit = (values: TransactionFormValues) => {
    const updatedItem: TransactionsTransactionItem = {
      userID: "9dce56ac-35bf-48e5-8fc9-62303e66de2f",
      clientID: clientID,
      roleID: 1,
      transactionID:
        editingTxn?.transactionID || Math.floor(20000 + Math.random() * 80000),
      participantName: values.participantName || "Kneeland Fund - Regular",
      fund: values.fund || "PRB01",
      fundName: "Presbytery Of Boston Endowment",
      transactionCode: "II",
      transactionCodeDesc: values.transactionCodeDesc || "Interest Income",
      transactionDate: `${values.transactionDate}T00:00:00`,
      transactionAmount: parseFloat(values.amount) || 0,
      transactionUnits: values.units ? parseFloat(values.units) : null,
      feeAmount: values.hasFee ? parseFloat(values.feeAmount) || 0 : 0,
      notes: values.notes || null,
      hasFees: values.hasFee ? "Y" : "N",
      fundPrice: values.fundPrice
        ? parseFloat(values.fundPrice.replace("$", ""))
        : 0,
    };

    if (editingTxn) {
      setAddedItems((prev) =>
        prev.map((i) =>
          i.transactionID === editingTxn.transactionID ? updatedItem : i,
        ),
      );
    } else {
      setAddedItems([updatedItem, ...addedItems]);
    }

    setIsAddDrawerOpen(false);
    setEditingTxn(null);
  };

  // Search Filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return transactionsData;
    const query = searchQuery.toLowerCase();
    return transactionsData.filter((item) => {
      return (
        String(item.transactionID || "")
          .toLowerCase()
          .includes(query) ||
        item.participantName?.toLowerCase().includes(query) ||
        item.fund?.toLowerCase().includes(query) ||
        item.transactionCodeDesc?.toLowerCase().includes(query) ||
        item.notes?.toLowerCase().includes(query)
      );
    });
  }, [transactionsData, searchQuery]);

  // Initial values for editing form
  const initialFormValues: Partial<TransactionFormValues> | undefined =
    useMemo(() => {
      if (!editingTxn) return undefined;
      return {
        participantName:
          editingTxn.participantName || editingTxn.accountName || "",
        fund: editingTxn.fund || editingTxn.fundName || "PRB01",
        transactionCodeDesc:
          editingTxn.transactionCodeDesc ||
          editingTxn.transactionCode ||
          "Interest Income",
        fundPrice: editingTxn.fundPrice
          ? `$${editingTxn.fundPrice}`
          : "$1.400448",
        transactionDate: editingTxn.transactionDate
          ? editingTxn.transactionDate.split("T")[0]
          : new Date().toISOString().slice(0, 10),
        hasFee: editingTxn.hasFees === "Y" || (editingTxn.feeAmount ?? 0) > 0,
        amount: String(editingTxn.transactionAmount ?? editingTxn.amount ?? ""),
        reEnterAmount: String(
          editingTxn.transactionAmount ?? editingTxn.amount ?? "",
        ),
        units:
          editingTxn.transactionUnits !== null &&
          editingTxn.transactionUnits !== undefined
            ? String(editingTxn.transactionUnits)
            : "0",
        balance: "$0",
        notes: editingTxn.notes || "",
        feeAmount: String(editingTxn.feeAmount ?? "0"),
      };
    }, [editingTxn]);

  return (
    <div className="space-y-4">
      {/* Main Card Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Header Control Bar: Tabs on Left, Actions & Add Button on Right */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between border-b border-slate-200 bg-white px-4 pt-4 pb-0 gap-4">
          {/* Left: Tab Switcher */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleTabChange("Transactions")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === "Transactions"
                  ? "bg-white text-slate-900 border-portal-navy shadow-xs rounded-t-lg"
                  : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200/80 rounded-t-lg"
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => handleTabChange("pendingTransactions")}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                activeTab === "pendingTransactions"
                  ? "bg-white text-slate-900 border-portal-navy shadow-xs rounded-t-lg"
                  : "bg-slate-200 text-slate-600 border-transparent hover:bg-slate-300/80 rounded-t-lg"
              }`}
            >
              Pending Transactions
            </button>
          </div>

          {/* Right: Search + Export Buttons + Add Button */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pb-3">
            {/* Search Input */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search..."
              className="w-44 sm:w-56"
            />

            {/* Export & Refresh Icon Buttons */}
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3">
              <button
                onClick={handleExportExcel}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                title="Export Excel / CSV"
                type="button"
              >
                <div className="relative flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-slate-700" />
                  <span className="absolute text-[8px] font-black text-slate-900 right-0 bottom-0 bg-white px-0.5 rounded border border-slate-300">
                    X
                  </span>
                </div>
              </button>

              <button
                onClick={handleExportPDF}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
                title="Export PDF"
                type="button"
              >
                <div className="relative flex items-center justify-center">
                  <FileText className="h-5 w-5 text-slate-700" />
                  <span className="absolute text-[7px] font-black text-slate-900 -right-1 -bottom-0.5 bg-white px-0.5 rounded border border-slate-300">
                    PDF
                  </span>
                </div>
              </button>

              <button
                onClick={handleRefresh}
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

            {/* Primary Color Add Button */}
            <button
              onClick={() => {
                setEditingTxn(null);
                setIsAddDrawerOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-md bg-portal-navy px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
              type="button"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>

        {/* Tab Content rendering */}
        <div className="p-4 sm:p-6">
          {activeTab === "Transactions" ? (
            <TransactionsTab
              data={filteredData}
              isLoading={isLoading}
              selectedRowIndex={selectedRowIndex}
              onSelectRow={setSelectedRowIndex}
            />
          ) : (
            <PendingTransactionsTab
              data={filteredData}
              isLoading={isLoading}
              selectedRowIndex={selectedRowIndex}
              onSelectRow={setSelectedRowIndex}
              onEditRow={handleEditRow}
              onDeleteRow={handleDeleteRow}
            />
          )}
        </div>
      </div>

      {/* Right-to-Left Slide-over Drawer for Add/Edit Transaction Form */}
      {isAddDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsAddDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex">
            {/* Drawer Container */}
            <div className="w-screen max-w-3xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col  overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50/50">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingTxn ? "Edit" : "Add"}{" "}
                    {activeTab === "pendingTransactions" ? "Pending " : ""}
                    Transaction
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter transaction details to submit
                  </p>
                </div>
                <button
                  onClick={() => setIsAddDrawerOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Body - Reusable TanStack Form Component */}
              <div className="p-2">
                <AddTransactionForm
                  initialValues={initialFormValues}
                  isEditing={!!editingTxn}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setIsAddDrawerOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
