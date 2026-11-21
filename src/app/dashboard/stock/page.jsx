"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
import stockService from "@/services/stockService";
import referenceService from "@/services/referenceService";
import AddStockModal from "@/components/stock/AddStockModal";
import RemoveStockModal from "@/components/stock/RemoveStockModal";
import QuickSaleModal from "@/components/stock/QuickSaleModal";
import BatchViewModal from "@/components/stock/BatchViewModal";
import {
  ArrowUpDown,
  Search,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  Package,
  Eye,
  ArrowDown,
  ArrowUp,
  ShoppingCart,
  AlertTriangle,
  Clock,
  Filter,
  TrendingUp,
  History,
  LayoutGrid,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function StockManagerPage() {
  const [view, setView] = useState("products");

  // Companies for filter
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // Products State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");

  // Products Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [addModal, setAddModal] = useState({ isOpen: false, product: null });
  const [removeModal, setRemoveModal] = useState({
    isOpen: false,
    product: null,
  });
  const [saleModal, setSaleModal] = useState({ isOpen: false, product: null });
  const [batchModal, setBatchModal] = useState({
    isOpen: false,
    data: null,
    loading: false,
  });

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [transLoading, setTransLoading] = useState(false);
  const [transFilter, setTransFilter] = useState({
    type: "",
    reason: "",
    fromDate: new Date().toISOString().split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  // Load companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await referenceService.getCompanies();
        setCompanies(data);
      } catch (error) {
        console.error("Failed to load companies");
      }
    };
    loadCompanies();
  }, []);

  // Fetch products with pagination
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search) params.search = search;
      if (selectedCompany) params.company = selectedCompany;
      if (stockFilter === "lowStock") params.lowStock = "true";

      const res = await productService.getAll(params);
      if (res.success) {
        let filtered = res.data || [];
        if (stockFilter === "inStock")
          filtered = filtered.filter((p) => p.stock > 0);
        else if (stockFilter === "outOfStock")
          filtered = filtered.filter((p) => p.stock === 0);
        setProducts(filtered);

        // Map backend pagination properties directly
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
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedCompany, stockFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Handlers that reset page to 1
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCompanyChange = (e) => {
    setSelectedCompany(e.target.value);
    setPage(1);
  };

  const handleStockFilterChange = (e) => {
    setStockFilter(e.target.value);
    setPage(1);
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setTransLoading(true);
      const params = {};
      if (transFilter.type) params.type = transFilter.type;
      if (transFilter.reason) params.reason = transFilter.reason;
      if (transFilter.fromDate) params.fromDate = transFilter.fromDate;
      if (transFilter.toDate) params.toDate = transFilter.toDate;
      const res = await stockService.getTransactions(params);
      if (res.success) setTransactions(res.data);
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setTransLoading(false);
    }
  };

  useEffect(() => {
    if (view === "transactions") fetchTransactions();
  }, [view]);

  // Batch view
  const viewBatches = async (product) => {
    try {
      setBatchModal({ isOpen: true, data: null, loading: true });
      const res = await stockService.getBatches(product._id);
      if (res.success)
        setBatchModal({ isOpen: true, data: res.data, loading: false });
    } catch (error) {
      toast.error("Failed to load batch data");
      setBatchModal({ isOpen: false, data: null, loading: false });
    }
  };

  const getDisplayName = (product) => {
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed";
  };

  const stats = {
    total: totalRecords || products.length,
    inStock: products.filter((p) => p.stock > 0).length,
    lowStock: products.filter(
      (p) => p.stock > 0 && p.stock <= p.lowStockThreshold,
    ).length,
    outOfStock: products.filter((p) => p.stock === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ArrowUpDown className="w-6 h-6 text-green-700" />
            Stock Manager
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Purchase stock, record sales, manage damaged/expired items
          </p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              view === "products"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Products
          </button>
          <button
            onClick={() => setView("transactions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              view === "transactions"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Products View */}
      {view === "products" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Total Products",
                value: stats.total,
                icon: Package,
                color: "blue",
              },
              {
                label: "In Stock",
                value: stats.inStock,
                icon: TrendingUp,
                color: "green",
              },
              {
                label: "Low Stock",
                value: stats.lowStock,
                icon: AlertTriangle,
                color: "yellow",
              },
              {
                label: "Out of Stock",
                value: stats.outOfStock,
                icon: Clock,
                color: "red",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border-2 border-gray-100 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`bg-${stat.color}-50 p-2 rounded-lg`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-slate-900">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Company Filter + Search */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
              {/* Company Dropdown */}
              <div className="flex items-center gap-2 w-full lg:w-auto">
                <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <select
                  value={selectedCompany}
                  onChange={handleCompanyChange}
                  className="w-full lg:w-52 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">🏢 All Companies</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by product name..."
                  className="w-full pl-10 pr-4 py-2 text-slate-900 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Stock Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
                <select
                  value={stockFilter}
                  onChange={handleStockFilterChange}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Products</option>
                  <option value="inStock">✅ In Stock</option>
                  <option value="lowStock">⚠️ Low Stock</option>
                  <option value="outOfStock">🚫 Out of Stock</option>
                </select>

                <button
                  onClick={fetchProducts}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {/* Active company tag */}
            {selectedCompany && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1">
                  🏢 {companies.find((c) => c._id === selectedCompany)?.name}
                  <button
                    onClick={() => {
                      setSelectedCompany("");
                      setPage(1);
                    }}
                    className="ml-1 text-green-500 hover:text-green-800"
                  >
                    ✕
                  </button>
                </span>
                <span className="text-xs text-gray-500">
                  Showing {products.length} products from this company
                </span>
              </div>
            )}
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                <span className="ml-3 text-gray-500">Loading products...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No products match your filters
                </p>
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-12">
                          #
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                          Company
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                          Size
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden lg:table-cell">
                          Batches
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                          MRP
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden lg:table-cell">
                          Cust. ₹
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden lg:table-cell">
                          Dr. ₹
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product, index) => {
                        const isLow =
                          product.stock > 0 &&
                          product.stock <= product.lowStockThreshold;
                        const isOut = product.stock === 0;
                        return (
                          <tr
                            key={product._id}
                            className="hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-3 text-sm text-slate-500">
                              {(page - 1) * limit + index + 1}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">
                                {product.medicine ? "💊" : "🧴"}{" "}
                                {getDisplayName(product)}
                              </p>
                              {product.potency && (
                                <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded font-semibold">
                                  {product.potency.name}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                              {product.company?.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 hidden md:table-cell">
                              {product.size?.name || "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`text-lg font-bold ${isOut ? "text-red-600" : isLow ? "text-yellow-600" : "text-green-700"}`}
                              >
                                {product.stock}
                              </span>
                              {isLow && (
                                <AlertTriangle className="w-3 h-3 text-yellow-500 inline ml-1" />
                              )}
                              {isOut && (
                                <span className="text-[10px] text-red-500 block">
                                  OUT
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-slate-500 hidden lg:table-cell">
                              {product.batches?.length || 0}
                            </td>
                            <td className="px-4 py-3 text-center text-sm font-semibold text-slate-900">
                              {product.mrp > 0 ? `₹${product.mrp}` : "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-blue-700 hidden lg:table-cell font-medium">
                              {product.sellingPriceCustomer > 0
                                ? `₹${product.sellingPriceCustomer}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-purple-700 hidden lg:table-cell font-medium">
                              {product.sellingPriceDoctor > 0
                                ? `₹${product.sellingPriceDoctor}`
                                : "-"}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                <button
                                  onClick={() =>
                                    setAddModal({ isOpen: true, product })
                                  }
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-100 text-green-800 rounded-lg text-[11px] font-semibold hover:bg-green-200 transition border border-green-200"
                                >
                                  <Plus className="w-3 h-3" /> Add
                                </button>
                                <button
                                  onClick={() =>
                                    setSaleModal({ isOpen: true, product })
                                  }
                                  disabled={isOut}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-[11px] font-semibold hover:bg-blue-200 transition border border-blue-200 disabled:opacity-40"
                                >
                                  <ShoppingCart className="w-3 h-3" /> Sell
                                </button>
                                <button
                                  onClick={() =>
                                    setRemoveModal({ isOpen: true, product })
                                  }
                                  disabled={isOut}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-800 rounded-lg text-[11px] font-semibold hover:bg-red-200 transition border border-red-200 disabled:opacity-40"
                                >
                                  <Minus className="w-3 h-3" /> Remove
                                </button>
                                <button
                                  onClick={() => viewBatches(product)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-slate-700 rounded-lg text-[11px] font-semibold hover:bg-gray-200 transition border border-gray-200"
                                >
                                  <Eye className="w-3 h-3" /> Batches
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-slate-600">
                    Showing{" "}
                    <span className="font-semibold text-slate-900">
                      {(page - 1) * limit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-slate-900">
                      {Math.min(page * limit, totalRecords)}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                      {totalRecords}
                    </span>{" "}
                    products
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600">
                        Rows per page:
                      </span>
                      <select
                        value={limit}
                        onChange={(e) => {
                          setLimit(Number(e.target.value));
                          setPage(1);
                        }}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-slate-700 hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-slate-600">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        onClick={() =>
                          setPage((prev) => Math.min(prev + 1, totalPages))
                        }
                        disabled={page >= totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-slate-700 hover:bg-gray-100 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Transaction History */}
      {view === "transactions" && (
        <>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={transFilter.type}
                onChange={(e) =>
                  setTransFilter({ ...transFilter, type: e.target.value })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Types</option>
                <option value="IN">⬇️ Stock IN</option>
                <option value="OUT">⬆️ Stock OUT</option>
              </select>
              <select
                value={transFilter.reason}
                onChange={(e) =>
                  setTransFilter({ ...transFilter, reason: e.target.value })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Reasons</option>
                <option value="purchase">🛒 Purchase</option>
                <option value="sale">💰 Sale</option>
                <option value="damaged">🔨 Damaged</option>
                <option value="expired">⏰ Expired</option>
                <option value="returned">↩️ Returned</option>
              </select>
              <input
                type="date"
                value={transFilter.fromDate}
                onChange={(e) =>
                  setTransFilter({ ...transFilter, fromDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-gray-400 text-sm font-medium">to</span>
              <input
                type="date"
                value={transFilter.toDate}
                onChange={(e) =>
                  setTransFilter({ ...transFilter, toDate: e.target.value })
                }
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                onClick={fetchTransactions}
                disabled={transLoading}
                className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50 ml-auto"
              >
                <RefreshCw
                  className={`w-4 h-4 ${transLoading ? "animate-spin" : ""}`}
                />
                Load
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {transLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                <span className="ml-3 text-gray-500">Loading...</span>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-20">
                <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No transactions in this period</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1000px] text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">
                        Batch
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-right hidden md:table-cell">
                        Value
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider text-center hidden lg:table-cell">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                        By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((txn) => {
                      const productName =
                        txn.product?.medicine?.name ||
                        txn.product?.productName ||
                        "Product";
                      return (
                        <tr
                          key={txn._id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(txn.transactionDate).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded w-fit
                              ${txn.type === "IN" ? "text-green-700 bg-green-100 border border-green-200" : "text-red-700 bg-red-100 border border-red-200"}`}
                            >
                              {txn.type === "IN" ? (
                                <ArrowDown className="w-3 h-3" />
                              ) : (
                                <ArrowUp className="w-3 h-3" />
                              )}
                              {txn.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                            {productName}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell font-mono">
                            {txn.batchNumber || "-"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`text-sm font-bold ${txn.type === "IN" ? "text-green-700" : "text-red-700"}`}
                            >
                              {txn.type === "IN" ? "+" : "-"}
                              {txn.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-700 hidden md:table-cell font-medium">
                            ₹{txn.totalValue?.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize border
                              ${txn.reason === "purchase" ? "bg-green-50 text-green-700 border-green-200" : ""}
                              ${txn.reason === "sale" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
                              ${txn.reason === "damaged" ? "bg-orange-50 text-orange-700 border-orange-200" : ""}
                              ${txn.reason === "expired" ? "bg-red-50 text-red-700 border-red-200" : ""}
                              ${!["purchase", "sale", "damaged", "expired"].includes(txn.reason) ? "bg-gray-50 text-slate-700 border-gray-200" : ""}
                            `}
                            >
                              {txn.reason?.replace(/_/g, " ")}
                            </span>
                            {txn.reasonNote && (
                              <p
                                className="text-[10px] text-slate-400 mt-0.5 max-w-[200px] truncate"
                                title={txn.reasonNote}
                              >
                                {txn.reasonNote}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-slate-500 hidden lg:table-cell">
                            {txn.stockBefore} →{" "}
                            <strong>{txn.stockAfter}</strong>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                            {txn.performedBy?.name || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <AddStockModal
        isOpen={addModal.isOpen}
        onClose={() => setAddModal({ isOpen: false, product: null })}
        product={addModal.product}
        onSuccess={fetchProducts}
      />
      <RemoveStockModal
        isOpen={removeModal.isOpen}
        onClose={() => setRemoveModal({ isOpen: false, product: null })}
        product={removeModal.product}
        onSuccess={fetchProducts}
      />
      <QuickSaleModal
        isOpen={saleModal.isOpen}
        onClose={() => setSaleModal({ isOpen: false, product: null })}
        product={saleModal.product}
        onSuccess={fetchProducts}
      />
      <BatchViewModal
        isOpen={batchModal.isOpen}
        onClose={() =>
          setBatchModal({ isOpen: false, data: null, loading: false })
        }
        data={batchModal.data}
        loading={batchModal.loading}
      />
    </div>
  );
}
