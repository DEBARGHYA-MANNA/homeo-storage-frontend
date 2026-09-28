"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
import {
  Clock,
  Search,
  Loader2,
  RefreshCw,
  Package,
  ArrowLeft,
  CalendarX,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ExpiredReportPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchExpired = useCallback(async () => {
    try {
      setLoading(true);
      const params = { expired: "true" };
      if (search) params.search = search;

      const res = await productService.getAll(params);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch expired report");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpired();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExpired]);

  const getDisplayName = (product) => {
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed";
  };

  // Calculate days expired
  const getDaysExpired = (expiryDate) => {
    if (!expiryDate) return 0;
    const diff = new Date() - new Date(expiryDate);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Calculate wasted value
  const totalWastedValue = products.reduce(
    (sum, p) => sum + p.stock * p.purchasePrice,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-6 h-6 text-red-600" />
              Expired Products Report
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-7">
            Products that have passed their expiry date and should be removed
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <CalendarX className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-700">Expired Products</p>
              <p className="text-3xl font-bold text-red-800">
                {products.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-700">Wasted Stock Value</p>
              <p className="text-3xl font-bold text-orange-800">
                ₹{totalWastedValue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search expired products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-red-500
                         focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchExpired}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2
                       border border-gray-200 rounded-lg text-gray-600
                       hover:bg-red-50 hover:text-red-700
                       hover:border-red-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading report...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-green-600 font-semibold text-lg">
              All clear! 🎉
            </p>
            <p className="text-gray-400 text-sm mt-1">
              No expired products found in your inventory
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-12">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">
                    Size
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Batch
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Expiry Date
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Days Expired
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Wasted Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, index) => {
                  const daysExpired = getDaysExpired(product.expiryDate);
                  const wastedValue = product.stock * product.purchasePrice;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-red-50/30 transition"
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-800">
                          {product.medicine ? "💊" : "🧴"}{" "}
                          {getDisplayName(product)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {product.category?.name}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {product.company?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {product.size?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.batchNumber || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-red-600">
                          {product.expiryDate
                            ? new Date(product.expiryDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-sm font-bold px-2 py-1 rounded-full ${
                            daysExpired > 365
                              ? "bg-red-200 text-red-800"
                              : daysExpired > 90
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {daysExpired} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                        ₹{wastedValue.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
