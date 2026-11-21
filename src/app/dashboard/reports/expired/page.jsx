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

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchExpired = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        expired: "true",
        page,
        limit,
      };
      if (search) params.search = search;

      const res = await productService.getAll(params);
      if (res.success) {
        setProducts(res.data || []);
        const total =
          res.total ?? res.pagination?.total ?? res.data?.length ?? 0;
        const pages =
          res.totalPages ??
          res.pagination?.pages ??
          res.pagination?.totalPages ??
          (limit ? Math.ceil(total / limit) : 1);
        setTotalRecords(total);
        setTotalPages(pages || 1);
      }
    } catch (error) {
      toast.error("Failed to fetch expired report");
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpired();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchExpired]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

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

  // Calculate wasted stock value for current page items
  const pageWastedValue = products.reduce(
    (sum, p) => sum + (p.stock || 0) * (p.purchasePrice || 0),
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
              className="text-slate-600 hover:text-slate-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-red-600" />
              Expired Products Report
            </h1>
          </div>
          <p className="text-slate-600 text-sm ml-7">
            Products that have passed their expiry date and should be removed
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarX className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-900">
                Total Expired Items
              </p>
              <p className="text-3xl font-bold text-red-900">{totalRecords}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-900">
                Page Wasted Value
              </p>
              <p className="text-3xl font-bold text-orange-900">
                ₹{pageWastedValue.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-slate-700" />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Page Items Count
              </p>
              <p className="text-3xl font-bold text-slate-900">
                {products.length}
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
              placeholder="Search expired products..."
              className="w-full pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            />
          </div>
          <button
            onClick={fetchExpired}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-800 font-medium hover:bg-red-50 hover:text-red-900 hover:border-red-300 transition disabled:opacity-50"
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
            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            <span className="ml-3 text-slate-700 font-medium">
              Loading report...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-emerald-700 font-bold text-lg">All clear! 🎉</p>
            <p className="text-slate-600 text-sm mt-1">
              No expired products found in your inventory
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
                      Company
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Size
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Batch
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Expiry Date
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Days Expired
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Stock
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-700 uppercase">
                      Wasted Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((product, index) => {
                    const daysExpired = getDaysExpired(product.expiryDate);
                    const wastedValue =
                      (product.stock || 0) * (product.purchasePrice || 0);

                    return (
                      <tr
                        key={product._id}
                        className="hover:bg-red-50/40 transition"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-600">
                          {(page - 1) * limit + index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900">
                            {product.medicine ? "💊" : "🧴"}{" "}
                            {getDisplayName(product)}
                          </p>
                          <p className="text-xs text-slate-600">
                            {product.category?.name || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.company?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {product.size?.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                          {product.batchNumber || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-red-700">
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
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              daysExpired > 365
                                ? "bg-red-200 text-red-900"
                                : daysExpired > 90
                                  ? "bg-red-100 text-red-800"
                                  : "bg-orange-100 text-orange-800"
                            }`}
                          >
                            {daysExpired} days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                          {product.stock}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-red-700">
                          ₹{wastedValue.toLocaleString("en-IN")}
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
                      className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 shadow-sm"
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
