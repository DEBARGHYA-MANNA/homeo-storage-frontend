"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  HeartPulse,
  Package,
  Building2,
  Layers,
  Ruler,
  Droplets,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
} from "lucide-react";

// ============================================
// MENU CONFIGURATION
// Easy to add/remove/reorder menu items here
// ============================================
const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Companies",
    href: "/dashboard/companies",
    icon: Building2,
  },
  {
    label: "Categories",
    href: "/dashboard/categories",
    icon: Layers,
  },
  {
    label: "Sizes",
    href: "/dashboard/sizes",
    icon: Ruler,
  },
  {
    label: "Potencies",
    href: "/dashboard/potencies",
    icon: Droplets,
  },
  {
    label: "Use Types",
    href: "/dashboard/use-types",
    icon: HeartPulse,
  },
  {
    label: "Medicines",
    href: "/dashboard/medicines",
    icon: Pill,
  },
  {
    label: "Products",
    href: "/dashboard/products",
    icon: Package,
  },
];

const reportItems = [
  {
    label: "Low Stock",
    href: "/dashboard/reports/low-stock",
    icon: AlertTriangle,
  },
  {
    label: "Expired",
    href: "/dashboard/reports/expired",
    icon: Clock,
  },
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const pathname = usePathname();

  // Check if a menu item is active
  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ============================================ */}
      {/* MOBILE OVERLAY (dark background when open)   */}
      {/* ============================================ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* ============================================ */}
      {/* SIDEBAR                                      */}
      {/* ============================================ */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-gray-900 text-white
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isOpen ? "w-64" : "w-20"}
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ======================================== */}
        {/* LOGO SECTION                             */}
        {/* ======================================== */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 overflow-hidden"
          >
            <div className="bg-green-600 p-2 rounded-lg flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            {isOpen && (
              <span className="text-lg font-bold whitespace-nowrap">
                HomeoStore
              </span>
            )}
          </Link>

          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex items-center justify-center
                       w-8 h-8 rounded-lg hover:bg-gray-700 transition"
          >
            {isOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* ======================================== */}
        {/* MAIN MENU                                */}
        {/* ======================================== */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {/* Section Label */}
          {isOpen && (
            <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">
              Main Menu
            </p>
          )}

          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after clicking
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${
                    active
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }
                `}
                title={!isOpen ? item.label : ""}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active ? "text-white" : "text-gray-400 group-hover:text-white"
                  }`}
                />
                {isOpen && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}

          {/* ======================================== */}
          {/* REPORTS SECTION                          */}
          {/* ======================================== */}
          <div className="pt-4 mt-4 border-t border-gray-700">
            {isOpen && (
              <p className="text-xs text-gray-500 uppercase tracking-wider px-3 mb-2">
                Reports
              </p>
            )}

            {reportItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group
                    ${
                      active
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }
                  `}
                  title={!isOpen ? item.label : ""}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active
                        ? "text-white"
                        : "text-gray-400 group-hover:text-white"
                    }`}
                  />
                  {isOpen && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* ======================================== */}
        {/* FOOTER - Version Info                      */}
        {/* ======================================== */}
        {isOpen && (
          <div className="px-4 py-3 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              HomeoStore v1.0
            </p>
          </div>
        )}
      </aside>
    </>
  );
}