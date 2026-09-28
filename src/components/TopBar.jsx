"use client";

import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  LogOut,
  User,
  Bell,
  Search,
} from "lucide-react";

export default function TopBar({ toggleSidebar }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* ======================================== */}
        {/* LEFT SIDE - Hamburger + Search             */}
        {/* ======================================== */}
        <div className="flex items-center gap-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition lg:hidden"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Search Bar (hidden on small screens) */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2 w-80">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Search medicines, products..."
              className="bg-transparent text-sm text-gray-700 outline-none w-full placeholder-gray-400"
            />
          </div>
        </div>

        {/* ======================================== */}
        {/* RIGHT SIDE - Notifications + User          */}
        {/* ======================================== */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
            <Bell className="w-5 h-5 text-gray-600" />
            {/* Notification Dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200 hidden sm:block" />

          {/* User Info + Logout */}
          <div className="flex items-center gap-3">
            {/* User Avatar & Info */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-green-700" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {user?.role || "staff"}
                </p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 bg-red-50 text-red-600
                         px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}