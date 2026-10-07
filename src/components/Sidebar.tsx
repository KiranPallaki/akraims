"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LineChart as LineChartIcon,
  PlusCircle,
  Table,
  Users,
  Building2,
  Circle,
  LogOut,
} from "lucide-react";

import { fetchProductMenuList } from "@/lib/api";
import {
  getSelectedClient,
  getSavedUserSession,
  removeAuthToken,
} from "@/stores/authStore";
import { Client } from "@/types/client";
import { ProductMenuItem } from "@/types/menu";

// Helper function to map FontAwesome icon names to Lucide icons
export const renderMenuIcon = (
  iconName: string,
  className = "sidebar-icon",
) => {
  const name = iconName.toLowerCase().trim();

  if (name.includes("dashboard") || name.includes("tachometer")) {
    return <LayoutDashboard className={className} />;
  }
  if (
    name.includes("exchange") ||
    name.includes("swap") ||
    name.includes("rebalance")
  ) {
    return <ArrowLeftRight className={className} />;
  }
  if (
    name.includes("users") ||
    name.includes("user") ||
    name.includes("allocation")
  ) {
    return <Users className={className} />;
  }
  if (
    name.includes("chart") ||
    name.includes("performance") ||
    name.includes("line")
  ) {
    return <LineChartIcon className={className} />;
  }
  if (
    name.includes("calendar") ||
    name.includes("task") ||
    name.includes("event")
  ) {
    return <Calendar className={className} />;
  }
  if (
    name.includes("table") ||
    name.includes("reports") ||
    name.includes("grid")
  ) {
    return <Table className={className} />;
  }
  if (
    name.includes("file") ||
    name.includes("statements") ||
    name.includes("document")
  ) {
    return <FileText className={className} />;
  }
  if (
    name.includes("plus") ||
    name.includes("add") ||
    name.includes("participant") ||
    name.includes("fund")
  ) {
    return <PlusCircle className={className} />;
  }
  if (
    name.includes("question") ||
    name.includes("help") ||
    name.includes("faq")
  ) {
    return <HelpCircle className={className} />;
  }

  return <Circle className={className} />;
};

// Helper function to format the menu URL to an app router path
export const getMenuHref = (toURL: string): string => {
  const cleanUrl = toURL.trim().toLowerCase().replace(/\s+/g, "-");
  if (cleanUrl === "dashboard" || cleanUrl === "" || cleanUrl === "/") {
    return "/screens";
  }
  return `/screens/${cleanUrl}`;
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<ProductMenuItem[]>([]);
  const [selectedClient, setSelectedClientState] = useState<Client | null>(
    null,
  );
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

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
      const lastName = userSession.lastName || userSession.LastName || "";
      setUserName(`${name} ${lastName}`.trim());
      setUserEmail(userSession.email || userSession.Email || "");
    }

    async function loadMenu() {
      setIsLoading(true);
      const res = await fetchProductMenuList(client?.clientID);
      let items: ProductMenuItem[] = res.ok && res.data ? res.data : [];
      const hasAllocationTest = items.some(
        (item) =>
          item.toURL?.toLowerCase().replace(/\s+/g, "-") === "allocation-test" ||
          item.webPageFile?.toLowerCase() === "allocation test",
      );
      if (!hasAllocationTest) {
        items = [
          ...items,
          {
            clientID: client?.clientID,
            webPageFile: "Allocation Test",
            webPageStatus: "Y",
            icon: "allocation",
            toURL: "allocation-test",
          },
        ];
      }
      setMenuItems(items);
      setIsLoading(false);
    }

    loadMenu();
  }, []);

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen border-r border-gray-200 bg-gradient-to-b from-white to-slate-50 transition-all duration-300 flex flex-col dark:border-gray-700 dark:bg-gray-800 ${
        isCollapsed ? "w-16" : "w-[16rem]"
      }`}
    >
      {/* Brand Logo & Header */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-3">
              <Image
                alt="AKRA LOGO"
                height={52}
                src="/AKRA_JPEG_LOGO_250-250.jpg"
                width={110}
                className="h-auto object-contain"
              />

              <span className="font-bold text-[#051a36] text-lg tracking-wider dark:text-white">
                IMS
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          type="button"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-9 rounded-lg bg-gray-200/60 animate-pulse dark:bg-gray-700/50"
              />
            ))}
          </div>
        ) : (
          menuItems
            .filter((item) => item.webPageStatus === "Y")
            .map((item, index) => {
              const href = getMenuHref(item.toURL);
              const isActive =
                pathname === href ||
                (href !== "/screens" && pathname?.startsWith(href));

              return (
                <Link
                  key={index}
                  href={href}
                  className={`sidebar-link ${
                    isActive ? "sidebar-link-active" : ""
                  } ${isCollapsed ? "justify-center px-2" : "px-3"}`}
                  title={isCollapsed ? item.webPageFile : undefined}
                >
                  {renderMenuIcon(
                    item.icon,
                    `sidebar-icon ${isActive ? "sidebar-icon-active" : ""}`,
                  )}
                  {!isCollapsed && (
                    <span className="truncate">{item.webPageFile}</span>
                  )}
                </Link>
              );
            })
        )}
      </nav>

      {/* User Info Section */}
      <div
        className={`border-t border-gray-200 p-3 dark:border-gray-700 ${isCollapsed ? "hidden" : "block"}`}
      >
        <div className="flex items-center gap-3 rounded-lg bg-gray-100/70 p-2.5 dark:bg-gray-700/40">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-portal-accent)] shadow-sm">
            <span className="font-semibold text-sm text-white">
              {userName.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900 text-sm dark:text-white">
              {userName}
            </p>
            <p className="truncate text-gray-500 text-xs dark:text-gray-400">
              {userEmail || "Authenticated"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400"
            title="Sign Out"
            type="button"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
