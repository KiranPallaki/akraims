"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef } from "@tanstack/react-table";
import { getSelectedClient } from "@/stores/authStore";
import { Client } from "@/types/client";
import { UserItem, RoleOption, AccountOption } from "./types";
import {
  fetchUsersList,
  deleteUser,
  toggleUserStatus,
  fetchUserRoles,
  fetchClientAccounts,
} from "./api";
import UserFormDrawer from "./components/UserFormDrawer";
import ReusableTable from "@/components/common/ReusableTable";
import SearchBar from "@/components/common/SearchBar";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";
import ConfirmDeleteModal from "@/components/common/ConfirmDeleteModal";
import { exportTableToPDF } from "@/lib/pdfExport";
import {
  Plus,
  RotateCw,
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";

export default function UsersScreenPage() {
  const [client, setClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Drawer & Modal states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [deleteModalUser, setDeleteModalUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  useEffect(() => {
    setClient(getSelectedClient());
  }, []);

  const clientID = client?.clientID;

  // 1. Fetch Users List using React Query hook
  const {
    data: usersList = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<UserItem[]>({
    queryKey: ["fetch-user-list", clientID],
    queryFn: () => fetchUsersList(clientID),
    staleTime: 1000 * 60 * 3,
  });

  // Local state for instant optimistic updates
  const [localUsers, setLocalUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    if (usersList.length > 0) {
      setLocalUsers(usersList);
    }
  }, [usersList]);

  // 2. Fetch Roles and Accounts for the Form
  const { data: roleOptions = [] } = useQuery<RoleOption[]>({
    queryKey: ["fetch-user-roles"],
    queryFn: fetchUserRoles,
    staleTime: 1000 * 60 * 10,
  });

  const { data: accountOptions = [] } = useQuery<AccountOption[]>({
    queryKey: ["fetch-client-accounts", clientID],
    queryFn: () => fetchClientAccounts(clientID),
    staleTime: 1000 * 60 * 10,
  });

  // 3. Search Filter
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return localUsers;
    const q = searchQuery.toLowerCase();
    return localUsers.filter(
      (u) =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.firstName || "").toLowerCase().includes(q) ||
        (u.lastName || "").toLowerCase().includes(q) ||
        (u.phoneNumber || "").toLowerCase().includes(q) ||
        (u.role || "").toLowerCase().includes(q),
    );
  }, [localUsers, searchQuery]);

  // Handlers
  const handleOpenAdd = () => {
    setEditingUser(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (user: UserItem) => {
    setEditingUser(user);
    setIsDrawerOpen(true);
  };

  const handleDelete = (user: UserItem) => {
    setDeleteModalUser(user);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteUser(deleteModalUser.id, clientID);
    setIsDeleting(false);

    if (res.ok) {
      setLocalUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
      setFeedbackBanner({
        type: "success",
        message: `User "${deleteModalUser.firstName} ${deleteModalUser.lastName}" was successfully removed.`,
      });
      setDeleteModalUser(null);
    } else {
      setDeleteError(res.message || "Failed to delete user.");
    }
  };

  // Inline status toggle matching Screenshot 1
  const handleToggleStatus = async (user: UserItem) => {
    const newStatus = !user.status;

    // Optimistically update
    setLocalUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
    );

    const res = await toggleUserStatus(user.id, user.status, clientID);
    if (!res.ok) {
      // Revert if failed
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: user.status } : u)),
      );
      setFeedbackBanner({
        type: "error",
        message: "Failed to update user status.",
      });
    } else {
      setFeedbackBanner({
        type: "success",
        message: `User "${user.firstName} ${user.lastName}" status set to ${
          newStatus ? "Active" : "Inactive"
        }.`,
      });
    }
  };

  const handleDrawerSuccess = (savedUser: UserItem, message: string) => {
    setIsDrawerOpen(false);
    setEditingUser(null);

    setLocalUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === savedUser.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = savedUser;
        return updated;
      }
      return [savedUser, ...prev];
    });

    setFeedbackBanner({
      type: "success",
      message,
    });
  };

  // Export handlers matching standard design
  const handleExportExcel = () => {
    if (filteredUsers.length === 0) return;
    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Phone Number",
      "Status",
      "Locked",
    ];
    const rows = filteredUsers.map((u) => [
      `"${(u.email || "").replace(/"/g, '""')}"`,
      `"${(u.firstName || "").replace(/"/g, '""')}"`,
      `"${(u.lastName || "").replace(/"/g, '""')}"`,
      `"${u.phoneNumber || "--"}"`,
      u.status ? "Active" : "Inactive",
      u.isLocked ? "Locked" : "--",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Users_List_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredUsers.length === 0) return;
    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Phone Number",
      "Status",
      "Locked",
    ];
    const rows = filteredUsers.map((u) => [
      u.email || "-",
      u.firstName || "-",
      u.lastName || "-",
      u.phoneNumber || "--",
      u.status ? "Active" : "Inactive",
      u.isLocked ? "Locked" : "--",
    ]);

    exportTableToPDF({
      fileName: `Users_List_${new Date().toISOString().slice(0, 10)}.pdf`,
      title: "User Directory",
      subtitle: `AKRA IMS - ${client?.clientName || "Selected Client"}`,
      headers,
      rows,
      orientation: "landscape",
    });
  };

  // Table Columns matching Screenshot 1 exactly
  const columns = useMemo<ColumnDef<UserItem>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => (
          <span className="font-normal text-slate-800">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "firstName",
        header: "First Name",
        cell: (info) => (
          <span className="text-slate-700 font-normal">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        cell: (info) => (
          <span className="text-slate-700 font-normal">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        accessorKey: "phoneNumber",
        header: "Phone Number",
        cell: (info) => {
          const val = (info.getValue() as string) || "--";
          const displayVal = val === "null null" || !val.trim() ? "--" : val;
          return (
            <span className="text-slate-600 font-normal">{displayVal}</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: (info) => {
          const isActive = Boolean(info.getValue());
          const user = info.row.original;
          return (
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => handleToggleStatus(user)}
              className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-emerald-500" : "bg-slate-300"
              }`}
              title={isActive ? "Deactivate User" : "Activate User"}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          );
        },
      },
      {
        accessorKey: "isLocked",
        header: "Locked",
        cell: (info) => {
          const isLocked = Boolean(info.getValue());
          return (
            <span className="text-slate-500 font-normal">
              {isLocked ? "Yes" : "--"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (info) => {
          const user = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleEdit(user)}
                className="btn-action-edit"
                title="Edit User"
                type="button"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(user)}
                className="btn-action-delete"
                title="Delete User"
                type="button"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <ConstantMessageBanner
          message={feedbackBanner.message}
          type={feedbackBanner.type}
          onClose={() => setFeedbackBanner(null)}
        />
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table Toolbar matching Image 1: Search, Export, Refresh & Add */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200 bg-white px-4 py-3 gap-3">
          {/* SearchBar */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search users..."
            className="w-full sm:w-72"
          />

          {/* Action Buttons: Export, Refresh & Add */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleExportExcel}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to Excel / CSV"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <span className="absolute text-[8px] font-black text-emerald-600 right-0 bottom-0 bg-white">
                  X
                </span>
              </div>
            </button>

            <button
              onClick={handleExportPDF}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Export to PDF"
              type="button"
            >
              <div className="relative flex items-center justify-center">
                <FileText className="h-5 w-5 text-red-500" />
                <span className="absolute text-[7px] font-black text-red-500 -right-1 -bottom-0.5 bg-white">
                  PDF
                </span>
              </div>
            </button>

            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Refresh Data"
              type="button"
            >
              <RotateCw
                className={`h-4 w-4 text-slate-700 ${
                  isFetching ? "animate-spin text-portal-navy" : ""
                }`}
              />
            </button>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 rounded-md bg-portal-navy px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-portal-navy-hover active:opacity-90 transition-colors"
              >
                <Plus size={16} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Reusable Table */}
        <div className="p-2">
          <ReusableTable
            columns={columns}
            data={filteredUsers}
            isLoading={isLoading}
            emptyMessage="No users found."
            containerClassName="border border-slate-200 shadow-2xs"
            headerClassName="bg-slate-50 text-slate-800 border-b border-slate-200 font-semibold"
            rowClassName="even:bg-slate-50/50 hover:bg-slate-50/90 transition-colors"
          />
        </div>
      </div>

      {/* Slide-over Side Bar Drawer for Add / Edit User Form */}
      <UserFormDrawer
        isOpen={isDrawerOpen}
        initialUser={editingUser}
        onClose={() => {
          setIsDrawerOpen(false);
          setEditingUser(null);
        }}
        onSuccess={handleDrawerSuccess}
        clientID={clientID}
        roleOptions={roleOptions}
        accountOptions={accountOptions}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(deleteModalUser)}
        onClose={() => {
          setDeleteModalUser(null);
          setDeleteError(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        itemName={
          deleteModalUser
            ? `${deleteModalUser.firstName} ${deleteModalUser.lastName} (${deleteModalUser.email})`
            : undefined
        }
        warningMessage="This action cannot be undone. All permissions and account associations for this user will be removed."
        errorMessage={deleteError}
        isDeleting={isDeleting}
        confirmButtonText="Delete User"
      />
    </div>
  );
}
