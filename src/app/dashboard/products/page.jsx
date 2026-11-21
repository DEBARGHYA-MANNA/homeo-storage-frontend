"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import productService from "@/services/productService";
import referenceService from "@/services/referenceService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import ProductForm, { emptyProductForm } from "@/components/forms/ProductForm";
import ProductBulkImportModal from "@/components/ProductBulkImportModal";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Upload,
  Pill,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Helper to standardise single objects or arrays into an array of IDs or Objects
const extractArray = (val) => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const extractIds = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((item) => item._id || item);
  return [val._id || val];
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [limit, setLimit] = useState(20);

  // Filters state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [useTypeFilter, setUseTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  // Reference filter options
  const [refOptions, setRefOptions] = useState({
    companies: [],
    categories: [],
    useTypes: [],
  });

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Form & Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyProductForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch Reference Masters for Filters
  useEffect(() => {
    const fetchMasterRefs = async () => {
      try {
        const [companies, categories, useTypes] = await Promise.all([
          referenceService.getCompanies(),
          referenceService.getCategories(),
          referenceService.getUseTypes(),
        ]);
        setRefOptions({
          companies: companies || [],
          categories: categories || [],
          useTypes: useTypes || [],
        });
      } catch (err) {
        console.error("Failed loading master filter options", err);
      }
    };
    fetchMasterRefs();
  }, []);

  // Fetch Products with Pagination & Filter Params
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: limit,
      };

      if (search.trim()) params.search = search.trim();
      if (typeFilter) params.productType = typeFilter;
      if (companyFilter) params.company = companyFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (useTypeFilter) params.useType = useTypeFilter;
      if (stockFilter) params.stockStatus = stockFilter;

      const res = await productService.getAll(params);
      if (res.success) {
        setProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.count || 0);
      }
    } catch (error) {
      toast.error("Failed to fetch products catalogue");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    limit,
    search,
    typeFilter,
    companyFilter,
    categoryFilter,
    useTypeFilter,
    stockFilter,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  // Reset to page 1 on filter changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearch("");
    setTypeFilter("");
    setCompanyFilter("");
    setCategoryFilter("");
    setUseTypeFilter("");
    setStockFilter("");
    setCurrentPage(1);
  };

  // Execute Bulk Import logic
  const handleBulkImport = async (rows) => {
    try {
      for (const row of rows) {
        const isMedicine = row.productType === "medicine";
        const payload = {
          productType: row.productType || "medicine",
          medicine: isMedicine ? row.medicine : undefined,
          productName: !isMedicine ? row.productName?.trim() : undefined,
          company: row.company || row.companies || [],
          category: row.category || row.categories?.[0] || "",
          size: row.size || row.sizes || [],
          potency: isMedicine
            ? row.potency || row.potencies?.[0] || undefined
            : undefined,
          useTypes: row.useTypes || [],
          lowStockThreshold: Number(row.lowStockThreshold) || 12,
          hsnCode: row.hsnCode?.trim() || "",
        };
        await productService.create(payload);
      }
      setIsImportModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Failed to bulk import products:", err);
      throw err;
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyProductForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setIsEditMode(true);
    setEditingId(product._id);

    let combinedUseTypes = [];
    if (product.useType) combinedUseTypes = extractIds(product.useType);
    else if (product.useTypes) combinedUseTypes = extractIds(product.useTypes);

    setFormData({
      productType: product.medicine ? "medicine" : "general",
      medicine: product.medicine?._id || product.medicine || "",
      productName: product.productName || "",
      company: extractIds(product.company),
      category: product.category?._id || product.category || "",
      size: extractIds(product.size),
      potency: product.potency?._id || product.potency || "",
      useTypes: combinedUseTypes,
      lowStockThreshold:
        product.lowStockThreshold !== undefined
          ? String(product.lowStockThreshold)
          : "12",
      hsnCode: product.hsnCode || "",
      keepCompanyAndCategory: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyProductForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    const isMed = formData.productType === "medicine";
    if (isMed && !formData.medicine)
      errors.medicine = "Medicine remedy is required";
    if (!isMed && !formData.productName.trim())
      errors.productName = "Product name is required";
    if (!formData.company || formData.company.length === 0)
      errors.company = "At least one company is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.size || formData.size.length === 0)
      errors.size = "At least one size packaging is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (saveAndAddAnother = false) => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const isMed = formData.productType === "general" ? false : true;
      const payload = {
        medicine: isMed ? formData.medicine : null,
        productName: !isMed ? formData.productName : "",
        companies: formData.company,
        categories: formData.category ? [formData.category] : [],
        sizes: formData.size,
        potencies: isMed && formData.potency ? [formData.potency] : [],
        useTypes: formData.useTypes,
        lowStockThreshold: Number(formData.lowStockThreshold) || 12,
        hsnCode: formData.hsnCode,
      };

      if (isEditMode) {
        const res = await productService.update(editingId, payload);
        if (res.success) {
          toast.success("Product properties updated successfully");
          closeModal();
          fetchProducts();
        }
      } else {
        const res = await productService.create(payload);
        if (res.success) {
          toast.success(`${res.summary?.created || 1} variant(s) registered`);
          fetchProducts();

          if (saveAndAddAnother || formData.keepCompanyAndCategory) {
            setFormData({
              ...emptyProductForm,
              productType: formData.productType,
              company: formData.company,
              category: formData.category,
              keepCompanyAndCategory: true,
            });
            setFormErrors({});
            toast.success("Company & Category preserved for next entry");
          } else {
            closeModal();
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (product) => {
    const name = product.medicine?.name || product.productName || "Product";
    setDeleteDialog({ isOpen: true, id: product._id, name });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await productService.delete(deleteDialog.id);
      if (res.success) {
        toast.success("Product deregistered successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const getDisplayName = (product) => {
    if (product.displayName) return product.displayName;
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed Item";
  };

  const getProductUseTypes = (product) => {
    const types = product.useTypes || product.useType || [];

    return extractArray(types)
      .filter(Boolean)
      .map((ut) => {
        if (typeof ut === "string") {
          return { _id: ut, name: ut };
        }

        return {
          _id: ut._id || ut.id || ut.name,
          name: ut.name || ut._id || "Unknown",
        };
      });
  };

  const activeFiltersCount = [
    typeFilter,
    companyFilter,
    categoryFilter,
    useTypeFilter,
    stockFilter,
  ].filter(Boolean).length;

  // Render full-page Bulk Import view when active
  if (isImportModalOpen) {
    return (
      <ProductBulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
        existingProducts={products}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Package className="w-7 h-7 text-green-700" />
            Products Registry
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure catalog master definitions. Manage stocks, prices, and
            batches in the Stock Manager.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Register Product
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              placeholder="Search by product name, remedy, SKU, HSN..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            />
            {search && (
              <button
                onClick={() => handleFilterChange(setSearch, "")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-lg text-sm font-medium transition ${
                activeFiltersCount > 0
                  ? "bg-green-50 border-green-300 text-green-800"
                  : "border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-green-700 text-white text-[11px] px-1.5 py-0.2 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              title="Refresh catalogue"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-green-700" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters Panel */}
        {showMobileFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) =>
                  handleFilterChange(setTypeFilter, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-2 focus:ring-green-600"
              >
                <option value="">All Types</option>
                <option value="medicine">💊 Medicines</option>
                <option value="general">🧴 General Items</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) =>
                  handleFilterChange(setCompanyFilter, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-2 focus:ring-green-600"
              >
                <option value="">All Companies</option>
                {refOptions.companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) =>
                  handleFilterChange(setCategoryFilter, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-2 focus:ring-green-600"
              >
                <option value="">All Categories</option>
                {refOptions.categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Use Type / Indication
              </label>
              <select
                value={useTypeFilter}
                onChange={(e) =>
                  handleFilterChange(setUseTypeFilter, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-2 focus:ring-green-600"
              >
                <option value="">All Indications</option>
                {refOptions.useTypes.map((ut) => (
                  <option key={ut._id} value={ut._id}>
                    {ut.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Stock Condition
              </label>
              <select
                value={stockFilter}
                onChange={(e) =>
                  handleFilterChange(setStockFilter, e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white text-gray-800 focus:ring-2 focus:ring-green-600"
              >
                <option value="">All Levels</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">⚠️ Low Stock</option>
                <option value="out_of_stock">🚫 Out of Stock</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Responsive Table & Pagination (Visible on ALL screen sizes) */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-9 h-9 text-green-700 animate-spin mb-2" />
            <span className="text-gray-500 text-sm">
              Fetching catalog entries...
            </span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-semibold text-base">
              No registered products found
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Try adjusting your search or active filters.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5 w-10">#</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Product Name</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Company</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Category</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Size</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">Potency</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5">
                    Use Type / Indications
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5 text-center">
                    MRP
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5 text-center">
                    Stock
                  </th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5 w-20">Status</th>
                  <th className="px-3 py-3 sm:px-4 sm:py-3.5 text-right w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {products.map((product, index) => {
                  const isLow =
                    product.stock <= (product.lowStockThreshold || 12);
                  const companies = extractArray(product.company);
                  const sizes = extractArray(product.size);
                  const useTypes = getProductUseTypes(product);
                  const globalIdx = (currentPage - 1) * limit + index + 1;

                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50/80 transition"
                    >
                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-xs text-gray-400 font-medium whitespace-nowrap">
                        {globalIdx}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                        <div className="flex items-center gap-2.5">
                          {product.medicine ? (
                            <Pill className="w-5 h-5 text-green-700 shrink-0" />
                          ) : (
                            <FlaskConical className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug whitespace-nowrap">
                              {getDisplayName(product)}
                            </p>
                            {product.sku && (
                              <p className="text-[11px] font-mono text-gray-400 mt-0.5 whitespace-nowrap">
                                {product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-gray-700">
                        {companies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {companies.map((c, i) => (
                              <span
                                key={c?._id || c?.id || i}
                                className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs whitespace-nowrap"
                              >
                                {typeof c === "object" ? c.name || "-" : c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-gray-700 whitespace-nowrap">
                        {typeof product.category === "object"
                          ? product.category?.name || "-"
                          : product.category || "-"}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-gray-700">
                        {sizes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sizes.map((s, i) => (
                              <span
                                key={s?._id || s?.id || i}
                                className="bg-teal-50 text-teal-800 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                              >
                                {typeof s === "object" ? s.name || "-" : s}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap">
                        {product.potency ? (
                          <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded text-xs font-semibold">
                            {typeof product.potency === "object"
                              ? product.potency?.name || "-"
                              : product.potency}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5">
                        {useTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {useTypes.map((ut) => (
                              <span
                                key={ut._id || ut}
                                className="inline-flex items-center text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded whitespace-nowrap"
                              >
                                {ut.name || ut}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-center font-medium text-gray-900 whitespace-nowrap">
                        {product.mrp > 0 ? (
                          `₹${product.mrp}`
                        ) : (
                          <span className="text-xs text-gray-400">
                            Unpriced
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`font-bold ${
                              product.stock === 0
                                ? "text-red-600"
                                : isLow
                                  ? "text-amber-600"
                                  : "text-gray-800"
                            }`}
                          >
                            {product.stock}
                          </span>
                          {product.stock === 0 ? (
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-red-500"
                              title="Out of Stock"
                            />
                          ) : isLow ? (
                            <AlertTriangle
                              className="w-3.5 h-3.5 text-amber-500"
                              title="Low Stock Alert"
                            />
                          ) : null}
                        </div>
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 whitespace-nowrap">
                        <StatusBadge isActive={product.isActive} />
                      </td>

                      <td className="px-3 py-3 sm:px-4 sm:py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                            title="Edit product parameters"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(product)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition"
                            title="Delete product definition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3.5 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-600 text-center sm:text-left">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * limit, totalCount)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
              products
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mr-2">
                <span>Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
                className="p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold px-2 text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 disabled:opacity-40 text-gray-700 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          isEditMode
            ? "Modify Catalogue Definition"
            : "Register Product Definition"
        }
        size="xl"
        footer={
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 w-full">
            <button
              onClick={closeModal}
              disabled={submitting}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {!isEditMode && (
              <button
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save & Add Another
              </button>
            )}
            <button
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? "Save Changes" : "Register Product"}
            </button>
          </div>
        }
      >
        <ProductForm
          formData={formData}
          onChange={setFormData}
          errors={formErrors}
        />
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Deregister Catalogue Product"
        message="Are you sure you want to delete this catalogue definition? Product definitions attached to active inventory batches should be removed with caution."
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}
