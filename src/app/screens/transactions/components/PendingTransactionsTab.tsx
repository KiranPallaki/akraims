"use client";

import React from "react";
import ReusableTable from "@/components/common/ReusableTable";
import { TransactionsTransactionItem } from "../types";
import { useTransactionColumns } from "./TransactionsTableColumns";

interface PendingTransactionsTabProps {
  data: TransactionsTransactionItem[];
  isLoading: boolean;
  selectedRowIndex: number | null;
  onSelectRow: (index: number) => void;
  onEditRow: (item: TransactionsTransactionItem) => void;
  onDeleteRow: (item: TransactionsTransactionItem) => void;
}

export default function PendingTransactionsTab({
  data,
  isLoading,
  selectedRowIndex,
  onSelectRow,
  onEditRow,
  onDeleteRow,
}: PendingTransactionsTabProps) {
  const columns = useTransactionColumns({
    activeTab: "pendingTransactions",
    onEdit: onEditRow,
    onDelete: onDeleteRow,
  });

  return (
    <ReusableTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      selectedIndex={selectedRowIndex}
      onRowClick={(_, idx) => onSelectRow(idx)}
      emptyMessage="No pending transactions found."
      containerClassName="border border-slate-200 shadow-2xs"
      headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200"
    />
  );
}
