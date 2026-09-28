"use client";

import { useState, useEffect, useCallback } from "react";
import saleService from "@/services/saleService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import {
  ShoppingCart,
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  XCircle,
  Calendar,
  IndianRupee,
  TrendingUp,
  Receipt,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Today's summary
  const [summary, setSummary] = useState(null);

  // Detail modal
  const [selectedSale, setSelectedSale] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState({ isOpen: false, id: null, number: "" });
  const [cancelling, setCancelling] = useState(false);

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = { date: dateFilter };
      if (search) params.search = search;
      const res = await saleService.getAll(params);
      if (res.success) setSales(res.data);
    } catch (error) {
      toast.error("Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, search]);

  const fetchSummary = async () => {
    try {
      const res = await saleService.getTodaySummary();
      if (res.success) setSummary(res.data);
    } catch (error) {
      console.error("Summary error:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchSales(), 300);
    return () => clearTimeout(timer);
  }, [fetchSales]);

  useEffect(() => {
    fetchSummary();
  }, []);

  // ============================================
  // VIEW SALE DETAIL
  // ============================================
  const viewSale = async (saleId) => {
    try {
      setDetailLoading(true);
      const res = await saleService.getById(saleId);
      if (res.success) setSelectedSale(res.data);
    } catch (error) {
      toast.error("Failed to load sale details");
    } finally {
      setDetailLoading(false);
    }
  };

  // ============================================
  // CANCEL SALE
  // ============================================
  const handleCancel = async () => {
    try {
      setCancelling(true);
      const res = await saleService.cancel(cancelDialog.id);
      if (res.success) {
        toast.success(res.message);
        setCancelDialog({ isOpen: false, id: null, number: "" });
        fetchSales();
        fetchSummary();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-700" />
            Sales History
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage all your daily sales transactions
          </p>
        </div>
        <Link
          href="/dashboard/sales/new"
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800
                     text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Sale
        </Link>
      </div>

      {/* Today's Summary (only if today is selected) */}
      {summary && dateFilter === new Date().toISOString().split("T")[0] && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today&apos;s Sales</p>
                <p className="text-xl font-bold text-gray-800">{summary.totalSales}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2 rounded-lg">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Revenue</p>
                <p className="text-xl font-bold text-green-700">
                  ₹{summary.totalRevenue?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-50 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Sale</p>
                <p className="text-xl font-bold text-gray-800">
                  ₹{summary.avgSaleValue?.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 p-2 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Items Sold</p>
                <p className="text-xl font-bold text-gray-800">{summary.totalItems}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by sale # or customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                           text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <button
            onClick={() => { fetchSales(); fetchSummary(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200
                       rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700
                       transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading sales...</span>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No sales found for this date</p>
            <Link
              href="/dashboard/sales/new"
              className="text-green-600 hover:text-green-700 text-sm font-medium mt-2 inline-block"
            >
              Create your first sale →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sale #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Items</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Payment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Time</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono font-semibold text-green-700">
                        {sale.saleNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {sale.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                      {sale.items?.length} items ({sale.items?.reduce((s, i) => s + i.quantity, 0)} pcs)
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800">
                      ₹{sale.totalAmount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full
                        ${sale.paymentMethod === "cash" ? "bg-green-100 text-green-700" : ""}
                        ${sale.paymentMethod === "upi" ? "bg-blue-100 text-blue-700" : ""}
                        ${sale.paymentMethod === "card" ? "bg-purple-100 text-purple-700" : ""}
                        ${sale.paymentMethod === "credit" ? "bg-orange-100 text-orange-700" : ""}
                      `}>
                        {sale.paymentMethod?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                      {new Date(sale.saleDate).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewSale(sale._id)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {sale.status === "completed" && (
                          <button
                            onClick={() =>
                              setCancelDialog({
                                isOpen: true,
                                id: sale._id,
                                number: sale.saleNumber,
                              })
                            }
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                            title="Cancel Sale"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* SALE DETAIL MODAL                            */}
      {/* ============================================ */}
      <Modal
        isOpen={!!selectedSale}
        onClose={() => setSelectedSale(null)}
        title={`Sale Details — ${selectedSale?.saleNumber || ""}`}
        size="lg"
      >
        {detailLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : selectedSale ? (
          <div className="space-y-4">
            {/* Customer & Payment Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-semibold text-gray-800">{selectedSale.customerName}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment</p>
                <p className="font-semibold text-gray-800 uppercase">{selectedSale.paymentMethod}</p>
              </div>
              <div>
                <p className="text-gray-500">Date & Time</p>
                <p className="font-semibold text-gray-800">
                  {new Date(selectedSale.saleDate).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-semibold ${selectedSale.status === "completed" ? "text-green-600" : "text-red-600"}`}>
                  {selectedSale.status?.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Product</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Price</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedSale.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {item.productName || "Product"}
                      </td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">₹{item.unitPrice}</td>
                      <td className="px-3 py-2 text-right font-semibold">₹{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="text-sm space-y-1 border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{selectedSale.subtotal}</span>
              </div>
              {selectedSale.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>-₹{selectedSale.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-green-700 border-t pt-2">
                <span>Total</span>
                <span>₹{selectedSale.totalAmount}</span>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ============================================ */}
      {/* CANCEL CONFIRMATION                          */}
      {/* ============================================ */}
      <ConfirmDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, id: null, number: "" })}
        onConfirm={handleCancel}
        title="Cancel Sale"
        message="This will cancel the sale and restore product stock."
        itemName={cancelDialog.number}
        loading={cancelling}
      />
    </div>
  );
}