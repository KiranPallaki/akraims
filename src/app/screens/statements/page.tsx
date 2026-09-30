"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { FileText, Download } from "lucide-react";

export default function StatementsPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <FileText size={18} /> Statements Module
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Account Statements</h2>
          <p className="text-xs text-slate-500 mt-1">
            Monthly and annual account statements for {client?.clientName || "Selected Client"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        {["August 2026 Monthly Statement", "July 2026 Monthly Statement", "June 2026 Monthly Statement", "2025 Annual Statement"].map((title, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-100 p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-semibold text-slate-800">{title}</span>
            </div>
            <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
              <Download size={14} /> Download PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
