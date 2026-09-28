"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import dashboardService from "@/services/dashboardService";
import {
  Package,
  Pill,
  Building2,
  Layers,
  Ruler,
  Droplets,
  HeartPulse,
  AlertTriangle,
  Clock,
  Ban,
  DollarSign,
  TrendingUp,
  Boxes,
  Loader2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin mr-3" />
        <span className="text-gray-500 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  const counts = stats?.counts || {};
  const alerts = stats?.alerts || {};
  const stockValue = stats?.stockValue || {};

  // ============================================
  // STAT CARDS DATA
  // ============================================
  const statCards = [
    {
      title: "Total Products",
      value: counts.totalProducts || 0,
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Medicines",
      value: counts.totalMedicines || 0,
      icon: Pill,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-100",
    },
    {
      title: "Companies",
      value: counts.totalCompanies || 0,
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-100",
    },
    {
      title: "Total Units in Stock",
      value: stockValue.totalUnits || 0,
      icon: Boxes,
      color: "text-teal-600",
      bg: "bg-teal-50",
      border: "border-teal-100",
    },
  ];

  // ============================================
  // FINANCIAL CARDS
  // ============================================
  const financialCards = [
    {
      title: "Stock Value (Purchase)",
      value: `₹${(stockValue.totalPurchaseValue || 0).toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      title: "Stock Value (MRP)",
      value: `₹${(stockValue.totalMRPValue || 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Potential Profit",
      value: `₹${(stockValue.potentialProfit || 0).toLocaleString("en-IN")}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  // ============================================
  // ALERT CARDS
  // ============================================
  const alertCards = [
    {
      title: "Low Stock Items",
      value: alerts.lowStock || 0,
      icon: AlertTriangle,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      href: "/dashboard/reports/low-stock",
      critical: (alerts.lowStock || 0) > 0,
    },
    {
      title: "Expired Products",
      value: alerts.expired || 0,
      icon: Clock,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      href: "/dashboard/reports/expired",
      critical: (alerts.expired || 0) > 0,
    },
    {
      title: "Out of Stock",
      value: alerts.outOfStock || 0,
      icon: Ban,
      color: "text-gray-600",
      bg: "bg-gray-50",
      border: "border-gray-200",
      href: "/dashboard/reports/low-stock",
      critical: (alerts.outOfStock || 0) > 0,
    },
  ];

  // ============================================
  // QUICK LINKS
  // ============================================
  const quickLinks = [
    { title: "Medicines", icon: Pill, href: "/dashboard/medicines", color: "text-green-600 bg-green-50" },
    { title: "Use Types", icon: HeartPulse, href: "/dashboard/use-types", color: "text-red-600 bg-red-50" },
    { title: "Products", icon: Package, href: "/dashboard/products", color: "text-blue-600 bg-blue-50" },
    { title: "Companies", icon: Building2, href: "/dashboard/companies", color: "text-purple-600 bg-purple-50" },
    { title: "Categories", icon: Layers, href: "/dashboard/categories", color: "text-orange-600 bg-orange-50" },
    { title: "Sizes", icon: Ruler, href: "/dashboard/sizes", color: "text-teal-600 bg-teal-50" },
    { title: "Potencies", icon: Droplets, href: "/dashboard/potencies", color: "text-indigo-600 bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      {/* ============================================ */}
      {/* PAGE HEADER                                  */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {user?.name?.split(" ")[0] || "Doctor"}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Here is your homeopathic store overview for today.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200
                     rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700
                     hover:border-green-200 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ============================================ */}
      {/* STAT CARDS                                   */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-white rounded-xl shadow-sm border ${card.border} p-5 hover:shadow-md transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bg} p-3 rounded-xl`}>
                  <Icon className={`w-7 h-7 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================================ */}
      {/* ALERT CARDS (Clickable)                      */}
      {/* ============================================ */}
      {(alerts.lowStock > 0 || alerts.expired > 0 || alerts.outOfStock > 0) && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Alerts & Warnings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {alertCards.map((card, index) => {
              const Icon = card.icon;
              if (!card.critical) return null;
              return (
                <Link
                  key={index}
                  href={card.href}
                  className={`bg-white rounded-xl shadow-sm border-2 ${card.border} p-5
                             hover:shadow-md transition group`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`${card.bg} p-2.5 rounded-lg`}>
                        <Icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{card.title}</p>
                        <p className={`text-2xl font-bold ${card.color}`}>
                          {card.value}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* FINANCIAL OVERVIEW                           */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          💰 Stock Valuation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {financialCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`${card.bg} p-2.5 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{card.title}</p>
                    <p className="text-xl font-bold text-gray-800 mt-0.5">
                      {card.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================ */}
      {/* QUICK ACCESS LINKS                           */}
      {/* ============================================ */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          ⚡ Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <Link
                key={index}
                href={link.href}
                className="bg-white rounded-xl shadow-sm border p-4
                           hover:shadow-md transition flex flex-col
                           items-center gap-3 text-center group"
              >
                <div
                  className={`${link.color} p-3 rounded-lg group-hover:scale-110 transition`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {link.title}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ============================================ */}
      {/* MASTER COUNTS SUMMARY                        */}
      {/* ============================================ */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📋 Master Data Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Medicine Products", value: counts.medicineProducts || 0, emoji: "💊" },
            { label: "General Products", value: counts.generalProducts || 0, emoji: "🧴" },
            { label: "Categories", value: counts.totalCategories || 0, emoji: "📂" },
            { label: "Sizes", value: counts.totalSizes || 0, emoji: "📏" },
            { label: "Potencies", value: counts.totalPotencies || 0, emoji: "💧" },
            { label: "Use Types", value: counts.totalUseTypes || 0, emoji: "❤️" },
          ].map((item, index) => (
            <div
              key={index}
              className="text-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-2xl">{item.emoji}</span>
              <p className="text-xl font-bold text-gray-800 mt-1">
                {item.value}
              </p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}