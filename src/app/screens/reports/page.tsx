"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { Table, Download, FileText } from "lucide-react";

export default function ReportsPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Table size={18} /> Reports Module
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Financial Reports</h2>
          <p className="text-xs text-slate-500 mt-1">
            Download and view reports for {client?.clientName || "Selected Client"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["Client Holdings Summary", "Asset Allocation Breakdown", "Audit Log & History", "Tax Year End Summary"].map((reportTitle, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{reportTitle}</h4>
                <p className="text-xs text-slate-400">PDF / Excel format available</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
              <Download size={14} /> Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
