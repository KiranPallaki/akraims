"use client";

import { ChevronDown, Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getClientsApi } from "@/lib/api";
import {
  getSelectedClient,
  removeAuthToken,
  setSelectedClient,
} from "@/stores/authStore";
import { Client } from "@/types/client";

export default function SelectClientPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClientState] = useState<Client | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load previously selected client if exists
    const savedClient = getSelectedClient();
    if (savedClient) {
      setSelectedClientState(savedClient);
    }

    async function fetchClients() {
      setIsLoading(true);
      setErrorMessage("");
      const result = await getClientsApi();
      if (result.ok && result.data && result.data.length > 0) {
        setClients(result.data);
      } else {
        setErrorMessage(
          result.error ||
            "Failed to load clients. Please check your connection.",
        );
      }
      setIsLoading(false);
    }

    fetchClients();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsSearching(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!isSearching || !searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      c.clientCode.toLowerCase().includes(q)
    );
  });

  const handleSelectClient = (client: Client) => {
    setSelectedClientState(client);
    setIsSearching(false);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleSignOut = () => {
    removeAuthToken();
    router.push("/login");
  };

  const handleDone = () => {
    if (!selectedClient) {
      setErrorMessage("Please select a client to continue.");
      return;
    }
    setSelectedClient(selectedClient);
    router.replace("/screens");
  };

  const displayInputValue = isSearching
    ? searchQuery
    : selectedClient
      ? selectedClient.clientName
      : "";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#f2f5fa] p-2 font-sans">
      {/* Sign Out option at top right corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 font-medium text-sm text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-red-400"
          type="button"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="w-full max-w-lg rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-800 text-lg">
          Select Client
        </h2>

        {errorMessage && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-red-600 text-sm">
            {errorMessage}
          </div>
        )}

        {/* Select Field */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex cursor-pointer items-center justify-between rounded-md border border-blue-500 bg-white px-2 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-blue-400"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <input
              className="w-full bg-transparent text-gray-700 placeholder-gray-400 text-sm outline-none cursor-pointer"
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
                if (!isOpen) setIsOpen(true);
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
              }}
              onFocus={() => {
                if (selectedClient) {
                  // Allow user to start typing to filter
                }
              }}
              placeholder="Search or select client..."
              type="text"
              value={displayInputValue}
            />
            <div className="flex items-center gap-2 pl-2 text-gray-400 border-l border-gray-200">
              {isLoading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <div
                    className={`cursor-pointer px-4 py-3 text-sm transition-colors hover:bg-blue-50 hover:text-blue-600 ${
                      selectedClient?.clientID === client.clientID
                        ? "bg-blue-50 font-semibold text-blue-600"
                        : "text-gray-700"
                    }`}
                    key={client.clientID}
                    onClick={() => handleSelectClient(client)}
                  >
                    {client.clientName}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400 text-sm">
                  {isLoading ? "Loading clients..." : "No clients found"}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Client Info section showing selected client */}
        {selectedClient && (
          <div className="mt-2 pt-2">
            <div className="mb-3 text-slate-400 text-sm font-normal">
              Client Info
            </div>
            <div className="flex items-center gap-3.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2998ff] text-white">
                <span className="text-xl font-medium">
                  {selectedClient.clientName.charAt(0).toUpperCase()}
                </span>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#22c55e] ring-2 ring-white" />
              </div>
              <div className="flex flex-col">
                <span className=" text-slate-800 text-[13px] leading-snug">
                  {selectedClient.clientName}
                </span>
                <span className="text-slate-400 text-sm font-normal">
                  {selectedClient.contactName ||
                    (selectedClient as any).ContactName ||
                    "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            className="rounded-md bg-[#6b9ae8] px-3 py-2 font-medium text-sm text-white shadow-sm transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-[#cbd5e1]"
            disabled={!selectedClient || isLoading}
            onClick={handleDone}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
