"use client";

import { useEffect, useState } from "react";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { HelpCircle, ChevronDown } from "lucide-react";

export default function FaqsPage() {
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const faqs = [
    {
      q: "How do I update client allocation parameters?",
      a: "Navigate to the Allocations module from the sidebar navigation and click on 'New Allocation' or select an existing parameter to edit."
    },
    {
      q: "Where can I view monthly statement history?",
      a: "Monthly and annual PDF statements are located in the Statements module."
    },
    {
      q: "How is fund performance calculated?",
      a: "Fund performance is calculated using Time-Weighted Return (TWR) standards, updated nightly after market close."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
            <HelpCircle size={18} /> Frequently Asked Questions
          </div>
          <h2 className="mt-1 text-2xl font-bold text-slate-800">Support & FAQs</h2>
          <p className="text-xs text-slate-500 mt-1">
            Common questions regarding AKRA IMS portal features
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="font-bold text-slate-800 text-sm flex items-center justify-between">
              <span>{faq.q}</span>
              <ChevronDown size={16} className="text-slate-400" />
            </h4>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
