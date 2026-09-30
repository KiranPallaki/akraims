"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { Calendar, CheckCircle2, Clock } from "lucide-react";

export default function TaskPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Calendar size={18} /> Task Management
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Tasks & Workflow</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pending tasks for client {client?.clientName || ""} ({client?.clientCode || ""})
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Monthly Rebalance Audit</p>
              <p className="text-xs text-slate-500">Due tomorrow at 5:00 PM</p>
            </div>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">Pending</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-slate-100 p-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="font-semibold text-slate-800 text-sm">Q3 Statement Generation</p>
              <p className="text-xs text-slate-500">Completed by Ops Team</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Done</span>
        </div>
      </div>
    </div>
  );
}
