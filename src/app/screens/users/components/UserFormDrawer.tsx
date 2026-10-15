"use client";

import React, { useState, useEffect } from "react";
import SlideOverDrawer from "@/components/common/SlideOverDrawer";
import ConstantMessageBanner from "@/components/common/ConstantMessageBanner";
import { UserItem, UserFormValues, RoleOption, AccountOption } from "../types";
import { createUser, updateUser, resetUserPassword } from "../api";
import { ChevronDown, RefreshCw, KeyRound, Check } from "lucide-react";

interface UserFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedUser: UserItem, message: string) => void;
  initialUser?: UserItem | null;
  clientID?: number;
  roleOptions: RoleOption[];
  accountOptions: AccountOption[];
}

export default function UserFormDrawer({
  isOpen,
  onClose,
  onSuccess,
  initialUser,
  clientID,
  roleOptions,
  accountOptions,
}: UserFormDrawerProps) {
  const isEditing = Boolean(initialUser);

  const [formValues, setFormValues] = useState<UserFormValues>({
    email: "",
    firstName: "",
    lastName: "",
    countryCode: "+1",
    phoneNumber: "",
    role: "User",
    accountNumbers: [],
    status: true,
  });

  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Sync form values when initialUser changes
  useEffect(() => {
    if (initialUser) {
      setFormValues({
        email: initialUser.email || "",
        firstName: initialUser.firstName || "",
        lastName: initialUser.lastName || "",
        countryCode: initialUser.countryCode || "+1",
        phoneNumber: initialUser.phoneNumber && initialUser.phoneNumber !== "--" ? initialUser.phoneNumber : "",
        role: initialUser.role || "User",
        accountNumbers: initialUser.accountNumbers || [],
        status: initialUser.status ?? true,
      });
    } else {
      setFormValues({
        email: "",
        firstName: "",
        lastName: "",
        countryCode: "+1",
        phoneNumber: "",
        role: "User",
        accountNumbers: [],
        status: true,
      });
    }
    setBannerMessage(null);
    setIsAccountDropdownOpen(false);
  }, [initialUser, isOpen]);

  // Handle Account Selection Toggle
  const toggleAccount = (accNumber: string) => {
    setFormValues((prev) => {
      const exists = prev.accountNumbers.includes(accNumber);
      return {
        ...prev,
        accountNumbers: exists
          ? prev.accountNumbers.filter((a) => a !== accNumber)
          : [...prev.accountNumbers, accNumber],
      };
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formValues.email.trim()) {
      setBannerMessage({ type: "error", message: "Email is required." });
      return;
    }
    if (!formValues.firstName.trim()) {
      setBannerMessage({ type: "error", message: "First Name is required." });
      return;
    }
    if (!formValues.lastName.trim()) {
      setBannerMessage({ type: "error", message: "Last Name is required." });
      return;
    }

    setIsSubmitting(true);
    setBannerMessage(null);

    if (isEditing && initialUser) {
      const res = await updateUser(initialUser.id, formValues, clientID);
      setIsSubmitting(false);

      if (res.ok) {
        onSuccess(
          {
            ...initialUser,
            ...formValues,
          },
          `User "${formValues.firstName} ${formValues.lastName}" was successfully updated.`
        );
      } else {
        setBannerMessage({
          type: "error",
          message: res.message || "Failed to update user.",
        });
      }
    } else {
      const res = await createUser(formValues, clientID);
      setIsSubmitting(false);

      if (res.ok) {
        onSuccess(
          {
            id: res.data?.id || Date.now(),
            ...formValues,
            status: true,
          },
          `User "${formValues.firstName} ${formValues.lastName}" was successfully created.`
        );
      } else {
        setBannerMessage({
          type: "error",
          message: res.message || "Failed to create user.",
        });
      }
    }
  };

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!initialUser) return;
    setIsResettingPassword(true);
    const res = await resetUserPassword(initialUser.id, formValues.email, clientID);
    setIsResettingPassword(false);

    if (res.ok) {
      setBannerMessage({
        type: "success",
        message: res.message || `Password reset instructions sent to ${formValues.email}`,
      });
    } else {
      setBannerMessage({
        type: "error",
        message: res.message || "Failed to initiate password reset.",
      });
    }
  };

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${initialUser?.firstName} ${initialUser?.lastName}` : "Add User"}
      subtitle="Configure user credentials, system role, and accessible account numbers"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-full bg-white text-xs">
        {/* Banner Feedback Message */}
        {bannerMessage && (
          <div className="p-4 pb-0">
            <ConstantMessageBanner
              type={bannerMessage.type}
              message={bannerMessage.message}
              onClose={() => setBannerMessage(null)}
            />
          </div>
        )}

        {/* User Form matching Screenshot 2 */}
        <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* Email */}
          <div className="space-y-1">
            <label className="form-label font-medium text-slate-700">
              Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={formValues.email}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="alloomis@loomisandco.com"
              className="form-input-standard h-8 text-xs"
              required
            />
          </div>

          {/* First Name */}
          <div className="space-y-1">
            <label className="form-label font-medium text-slate-700">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formValues.firstName}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, firstName: e.target.value }))
              }
              placeholder="Art"
              className="form-input-standard h-8 text-xs"
              required
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <label className="form-label font-medium text-slate-700">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formValues.lastName}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, lastName: e.target.value }))
              }
              placeholder="Loomis"
              className="form-input-standard h-8 text-xs"
              required
            />
          </div>

          {/* Phone Number with Country Code */}
          <div className="space-y-1">
            <label className="form-label font-medium text-slate-700">
              Phone Number
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formValues.countryCode}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, countryCode: e.target.value }))
                }
                placeholder="+1"
                className="w-16 form-input-standard h-8 text-xs text-center font-medium"
              />
              <input
                type="tel"
                value={formValues.phoneNumber}
                onChange={(e) =>
                  setFormValues((prev) => ({ ...prev, phoneNumber: e.target.value }))
                }
                placeholder="Phone Number"
                className="flex-1 form-input-standard h-8 text-xs"
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div className="space-y-1">
            <label className="form-label font-medium text-slate-700">
              Role
            </label>
            <select
              value={formValues.role}
              onChange={(e) =>
                setFormValues((prev) => ({ ...prev, role: e.target.value }))
              }
              className="form-input-standard h-8 text-xs bg-white"
            >
              <option value="" disabled>
                Select Role
              </option>
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number Multi-select Dropdown */}
          <div className="space-y-1 relative">
            <label className="form-label font-medium text-slate-700">
              Account Number
            </label>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              className="w-full h-8 px-3 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 flex items-center justify-between shadow-2xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#051a36]/15 transition-all text-left"
            >
              <span className="truncate">
                {formValues.accountNumbers.length === 0
                  ? "0 selected"
                  : `${formValues.accountNumbers.length} selected (${formValues.accountNumbers.join(", ")})`}
              </span>
              <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
            </button>

            {/* Dropdown Menu */}
            {isAccountDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 space-y-1.5 max-h-48 overflow-y-auto">
                {accountOptions.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">
                    No accounts available
                  </p>
                ) : (
                  accountOptions.map((acc) => {
                    const isChecked = formValues.accountNumbers.includes(acc.value);
                    return (
                      <label
                        key={acc.value}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAccount(acc.value)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-portal-navy accent-[#051a36]"
                        />
                        <span className="truncate">{acc.label}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Form Action Buttons matching Screenshot 2 */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-1.5 text-xs shadow-2xs transition-colors"
            >
              Cancel
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResettingPassword}
                className="rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-1.5 text-xs shadow-2xs transition-colors flex items-center gap-1.5"
              >
                {isResettingPassword ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <KeyRound size={14} />
                    Reset Password
                  </>
                )}
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-portal-navy hover:bg-portal-navy-hover active:opacity-90 text-white font-semibold px-6 py-1.5 text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
    </SlideOverDrawer>
  );
}
