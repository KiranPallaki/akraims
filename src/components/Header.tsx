"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, LogOut, Menu, RefreshCw, User } from "lucide-react";
import {
  getSelectedClient,
  getSavedUserSession,
  removeAuthToken,
} from "@/stores/authStore";
import { Client } from "@/types/client";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [selectedClient, setSelectedClientState] = useState<Client | null>(
    null,
  );
  const [userName, setUserName] = useState<string>("User");

  useEffect(() => {
    const client = getSelectedClient();
    setSelectedClientState(client);

    const userSession = getSavedUserSession() as any;
    if (userSession) {
      const name =
        userSession.firstName ||
        userSession.FirstName ||
        userSession.name ||
        userSession.email ||
        "User";
      setUserName(name);
    }
  }, []);

  const getTitle = () => {
    if (!pathname || pathname === "/screens" || pathname === "/dashboard") return "Dashboard";
    const segment = pathname.split("/").filter(Boolean).pop();
    if (!segment || segment === "screens" || segment === "dashboard") return "Dashboard";
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleSwitchClient = () => {
    router.push("/select-client");
  };

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 ">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          type="button"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {selectedClient && (
          <button
            onClick={handleSwitchClient}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            title="Switch Selected Client"
            type="button"
          >
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="max-w-[150px] truncate font-semibold">
              {selectedClient.clientName}
            </span>
            <RefreshCw className="h-3 w-3 text-slate-400" />
          </button>
        )}

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <User size={18} />
          </div>
          <span className="hidden md:inline-block text-sm font-medium text-slate-700">
            {userName}
          </span>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Sign Out"
            type="button"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
