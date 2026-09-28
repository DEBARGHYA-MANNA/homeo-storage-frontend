"use client";

import {
  Pill,
  HeartPulse,
  Package,
  Building2,
  Layers,
  Ruler,
  Droplets,
  AlertTriangle,
  TrendingUp,
  DollarSign,
} from "lucide-react";

export default function DashboardPage() {
  // These will come from API later
  const stats = [
    {
      title: "Total Products",
      value: "0",
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Medicines",
      value: "0",
      icon: Pill,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Low Stock Items",
      value: "0",
      icon: AlertTriangle,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Stock Value",
      value: "₹0",
      icon: DollarSign,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
    },
  ];

  const quickLinks = [
    {
      title: "Medicines",
      icon: Pill,
      href: "/dashboard/medicines",
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Use Types",
      icon: HeartPulse,
      href: "/dashboard/use-types",
      color: "text-red-600 bg-red-50",
    },
    {
      title: "Products",
      icon: Package,
      href: "/dashboard/products",
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Companies",
      icon: Building2,
      href: "/dashboard/companies",
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Categories",
      icon: Layers,
      href: "/dashboard/categories",
      color: "text-orange-600 bg-orange-50",
    },
    {
      title: "Sizes",
      icon: Ruler,
      href: "/dashboard/sizes",
      color: "text-teal-600 bg-teal-50",
    },
    {
      title: "Potencies",
      icon: Droplets,
      href: "/dashboard/potencies",
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here is your store overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon
                    className={`w-6 h-6 ${stat.color.replace("bg-", "text-")}`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <a
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
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
