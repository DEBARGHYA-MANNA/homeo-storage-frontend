"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
import StatusBadge from "@/components/StatusBadge";
import {
  AlertTriangle,
  Search,
  Loader2,
  RefreshCw,
  Package,
  ArrowLeft,
  Ban,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LowStockReportPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLowStock = useCallback(async () => {
    try {
      setLoading(true);
      const params = { lowStock: "true" };
      if (search) params.search = search;

      const res = await productService.getAll(params);
      if (res.success) {
        setProducts(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch low stock report");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLowStock();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLowStock]);

  const getDisplayName = (product) => {
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed";
  };

  // Separate out-of-stock from low-stock
  const outOfStock = products.filter((p) => p.stock === 0);
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold,
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
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              Low Stock Report
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-7">
            Products that are running low or completely out of stock
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-yellow-700">Low Stock Items</p>
              <p className="text-3xl font-bold text-yellow-800">
                {lowStock.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-red-700">Out of Stock</p>
              <p className="text-3xl font-bold text-red-800">
                {outOfStock.length}
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
              placeholder="Search low stock products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                         text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500
                         focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchLowStock}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2
                       border border-gray-200 rounded-lg text-gray-600
                       hover:bg-yellow-50 hover:text-yellow-700
                       hover:border-yellow-200 transition disabled:opacity-50"
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
            <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading report...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-green-600 font-semibold text-lg">
              All clear! 🎉
            </p>
            <p className="text-gray-400 text-sm mt-1">
              No products are running low on stock
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">
                    Potency
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Stock
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Threshold
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">
                    Severity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, index) => {
                  const isOut = product.stock === 0;
                  const percentage =
                    product.lowStockThreshold > 0
                      ? Math.round(
                          (product.stock / product.lowStockThreshold) * 100,
                        )
                      : 0;

                  return (
                    <tr
                      key={product._id}
                      className={`hover:bg-gray-50 transition ${
                        isOut ? "bg-red-50/50" : ""
                      }`}
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
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">
                        {product.potency?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-lg font-bold ${
                            isOut ? "text-red-600" : "text-yellow-600"
                          }`}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {product.lowStockThreshold}
                      </td>
                      <td className="px-4 py-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            <Ban className="w-3 h-3" />
                            OUT
                          </span>
                        ) : percentage <= 30 ? (
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Critical
                          </span>
                        ) : percentage <= 70 ? (
                          <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Low
                          </span>
                        ) : (
                          <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                            Warning
                          </span>
                        )}
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
