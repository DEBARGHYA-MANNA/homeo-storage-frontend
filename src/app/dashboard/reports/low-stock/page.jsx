"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
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

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchLowStock = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        lowStock: "true",
        page,
        limit,
      };
      if (search) params.search = search;

      const res = await productService.getAll(params);
      if (res.success) {
        setProducts(res.data || []);
        const total = res.total ?? res.pagination?.total ?? res.data?.length ?? 0;
        const pages =
          res.totalPages ??
          res.pagination?.pages ??
          res.pagination?.totalPages ??
          (limit ? Math.ceil(total / limit) : 1);
        setTotalRecords(total);
        setTotalPages(pages || 1);
      }
    } catch (error) {
      toast.error("Failed to fetch low stock report");
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLowStock();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchLowStock]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const getDisplayName = (product) => {
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed";
  };

  // Separate out-of-stock from low-stock for visible items
  const outOfStockCount = products.filter((p) => p.stock === 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/dashboard"
              className="text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Low Stock Report
            </h1>
          </div>
          <p className="text-slate-600 text-sm ml-7">
            Products that are running low or completely out of stock
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                Low Stock (Page)
              </p>
              <p className="text-3xl font-bold text-amber-900">
                {lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Ban className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Out of Stock (Page)
              </p>
              <p className="text-3xl font-bold text-red-900">
                {outOfStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-slate-700" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Total Flagged Items
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {totalRecords}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search low stock products..."
              className="w-full pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
            />
          </div>
          <button
            onClick={fetchLowStock}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
            <span className="ml-3 text-slate-700 font-medium">
              Loading report...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-emerald-700 font-bold text-lg">All clear! 🎉</p>
            <p className="text-slate-600 text-sm mt-1">
              No products are running low on stock
            </p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase w-12">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Product Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Company
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Size
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Potency
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Stock
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Threshold
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase w-28">
                      Severity
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => {
                    const isOut = product.stock === 0;
                    const percentage =
                      product.lowStockThreshold > 0
                        ? Math.round(
                            (product.stock / product.lowStockThreshold) * 100
                          )
                        : 0;

                    return (
                      <tr
                        key={product._id}
                        className={`hover:bg-slate-50 transition ${
                          isOut ? "bg-red-50/40" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-600">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900">
                            {product.medicine ? "💊" : "🧴"}{" "}
                            {getDisplayName(product)}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.category?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.company?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.size?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.potency?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-base font-bold ${
                              isOut ? "text-red-700" : "text-amber-700"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                          {product.lowStockThreshold}
                        </td>
                        <td className="px-4 py-3">
                          {isOut ? (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                              <Ban className="w-3 h-3" />
                              OUT
                            </span>
                          ) : percentage <= 30 ? (
                            <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                              Critical
                            </span>
                          ) : percentage <= 70 ? (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full">
                              Low
                            </span>
                          ) : (
                            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2.5 py-1 rounded-full">
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

            {/* Pagination Controls */}
            {totalRecords > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center gap-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">
                      Rows per page:
                    </span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <span className="text-slate-700 font-medium">
                    Showing {Math.min((page - 1) * limit + 1, totalRecords)} to{" "}
                    {Math.min(page * limit, totalRecords)} of {totalRecords}{" "}
                    items
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-semibold text-slate-800 px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}