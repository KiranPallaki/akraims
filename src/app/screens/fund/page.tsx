"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { PlusCircle, Layers } from "lucide-react";

export default function FundPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <PlusCircle size={18} /> Fund Module
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Fund Setup & Management</h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure fund parameters for {client?.clientName || "Selected Client"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-blue-600" /> Active Funds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-100 p-4 bg-slate-50">
            <h4 className="font-bold text-slate-800 text-sm">Growth Equity Fund A</h4>
            <p className="text-xs text-slate-500 mt-1">NAV: $142.50 | Status: Active</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-4 bg-slate-50">
            <h4 className="font-bold text-slate-800 text-sm">Balanced Income Fund B</h4>
            <p className="text-xs text-slate-500 mt-1">NAV: $98.20 | Status: Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
