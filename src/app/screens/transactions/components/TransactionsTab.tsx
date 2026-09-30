"use client";

import React from "react";
import ReusableTable from "@/components/common/ReusableTable";
import { TransactionsTransactionItem } from "../types";
import { useTransactionColumns } from "./TransactionsTableColumns";

interface TransactionsTabProps {
  data: TransactionsTransactionItem[];
  isLoading: boolean;
  selectedRowIndex: number | null;
  onSelectRow: (index: number) => void;
}

export default function TransactionsTab({
  data,
  isLoading,
  selectedRowIndex,
  onSelectRow,
}: TransactionsTabProps) {
  const columns = useTransactionColumns({
    activeTab: "Transactions",
  });

  return (
    <ReusableTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      selectedIndex={selectedRowIndex}
      onRowClick={(_, idx) => onSelectRow(idx)}
      emptyMessage="No transactions found."
      containerClassName="border border-slate-200 shadow-2xs"
      headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200"
    />
  );
}
