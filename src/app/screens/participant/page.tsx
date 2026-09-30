"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSelectedClient } from "@/stores/authStore";
import {
  fetchParticipantBalances,
  fetchParticipantStatement,
} from "@/app/screens/dashboard/api";
import { Client } from "@/types/client";
import ParticipantBalancesTable from "@/app/screens/dashboard/ParticipantBalancesTable";
import ParticipantStatementTable from "@/app/screens/dashboard/ParticipantStatementTable";
import { Users, UserPlus } from "lucide-react";

export default function ParticipantPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    const selected = getSelectedClient();
    setClient(selected);
  }, []);

  const clientID = client?.clientID;

  const { data: participants = [], isLoading: isBalancesLoading } = useQuery({
    queryKey: ["participantBalances", clientID],
    queryFn: () => fetchParticipantBalances(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const { data: statements = [], isLoading: isStatementLoading } = useQuery({
    queryKey: ["participantStatement", clientID],
    queryFn: () => fetchParticipantStatement(clientID),
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = isBalancesLoading || isStatementLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <Users size={18} /> Participant Directory
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">
            Participant Balances & Activity
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Account summary and transactional activity breakdown for{" "}
            <span className="font-semibold text-slate-700">
              {client?.clientName || "Selected Client"}
            </span>
          </p>
        </div>

        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors self-start sm:self-auto">
          <UserPlus size={16} /> Add Participant
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <ParticipantBalancesTable data={participants} isLoading={isLoading} />
        <ParticipantStatementTable data={statements} isLoading={isLoading} />
      </div>
    </div>
  );
}
