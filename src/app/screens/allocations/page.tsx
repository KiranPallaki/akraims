"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { Users, Plus } from "lucide-react";

export default function AllocationsPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Users size={18} /> Allocations Module
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Portfolio Allocations</h2>
          <p className="text-xs text-slate-500 mt-1">
            Managing allocations for {client?.clientName || "Selected Client"} ({client?.clientCode || ""})
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Allocation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Equity Allocation</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">65.0%</p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-blue-600" style={{ width: "65%" }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Fixed Income</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">25.0%</p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: "25%" }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cash Reserve</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">10.0%</p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-amber-500" style={{ width: "10%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
