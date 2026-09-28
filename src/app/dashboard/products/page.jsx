"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/productService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import ProductBulkImportModal from "@/components/ProductBulkImportModal";
import ProductForm, { emptyProductForm } from "@/components/forms/ProductForm";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  RefreshCw,
  AlertTriangle,
  Filter,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyProductForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (typeFilter) params.productType = typeFilter;
      const res = await productService.getAll(params);
      if (res.success) setProducts(res.data);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

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
    setFormData({
      productType: product.medicine ? "medicine" : "general",
      medicine: product.medicine?._id || "",
      productName: product.productName || "",
      company: product.company?._id || "",
      category: product.category?._id || "",
      size: product.size?._id || "",
      potency: product.potency?._id || "",
      useTypes: product.useTypes?.map((u) => u._id) || [],
      mrp: product.mrp !== undefined ? product.mrp : "",
      purchasePrice:
        product.purchasePrice !== undefined ? product.purchasePrice : "",
      discount: product.discount !== undefined ? product.discount : "0",
      stock: product.stock !== undefined ? product.stock : "0",
      lowStockThreshold:
        product.lowStockThreshold !== undefined
          ? product.lowStockThreshold
          : "10",
      batchNumber: product.batchNumber || "",
      expiryDate: product.expiryDate
        ? new Date(product.expiryDate).toISOString().split("T")[0]
        : "",
      rackLocation: product.rackLocation || "",
      hsnCode: product.hsnCode || "3004",
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
    if (isMed && !formData.medicine) errors.medicine = "Medicine is required";
    if (!isMed && !formData.productName.trim())
      errors.productName = "Product name is required";
    if (!formData.company) errors.company = "Company is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.size) errors.size = "Size is required";
    if (!formData.mrp || Number(formData.mrp) < 0)
      errors.mrp = "Valid MRP is required";
    if (!formData.purchasePrice || Number(formData.purchasePrice) < 0)
      errors.purchasePrice = "Valid purchase price is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const isMed = formData.productType === "medicine";
      const payload = {
        medicine: isMed ? formData.medicine : null,
        productName: !isMed ? formData.productName : "",
        company: formData.company,
        category: formData.category,
        size: formData.size,
        potency: isMed && formData.potency ? formData.potency : null,
        useTypes: formData.useTypes,
        mrp: Number(formData.mrp),
        purchasePrice: Number(formData.purchasePrice),
        discount: Number(formData.discount) || 0,
        stock: Number(formData.stock) || 0,
        lowStockThreshold: Number(formData.lowStockThreshold) || 10,
        batchNumber: formData.batchNumber,
        expiryDate: formData.expiryDate || null,
        rackLocation: formData.rackLocation,
        hsnCode: formData.hsnCode,
      };

      if (isEditMode) {
        const res = await productService.update(editingId, payload);
        if (res.success) {
          toast.success("Product updated successfully");
          closeModal();
          fetchProducts();
        }
      } else {
        const res = await productService.create(payload);
        if (res.success) {
          toast.success("Product created successfully");
          closeModal();
          fetchProducts();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
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
        toast.success("Product deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchProducts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // BULK IMPORT (using dropdown-selected IDs)
  // ============================================
  const handleBulkImport = async (rows) => {
    let success = 0;
    let failed = 0;
    const errors = [];

    for (const row of rows) {
      try {
        const isMed = row.productType === "medicine";

        const payload = {
          medicine: isMed ? row.medicine : null,
          productName: !isMed ? row.productName || "" : "",
          company: row.company,
          category: row.category,
          size: row.size,
          potency: isMed && row.potency ? row.potency : null,
          useTypes: row.useTypes || [],
          mrp: Number(row.mrp) || 0,
          purchasePrice: Number(row.purchasePrice) || 0,
          stock: Number(row.stock) || 0,
          lowStockThreshold: 10,
          batchNumber: row.batchNumber || "",
          expiryDate: row.expiryDate || null,
          rackLocation: row.rackLocation || "",
          hsnCode: "3004",
        };

        const res = await productService.create(payload);
        if (res.success) success++;
      } catch (error) {
        failed++;
        const identifier = row.productName || "Product";
        errors.push(
          `${identifier}: ${error.response?.data?.message || error.message}`,
        );
      }
    }

    fetchProducts();
    return { success, failed, errors };
  };

  const getDisplayName = (product) => {
    if (product.medicine?.name) return product.medicine.name;
    return product.productName || "Unnamed";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-green-700" />
            Products
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all stock items — medicines, shampoos, oils, creams & more
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Bulk Import
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, medicines..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option value="medicine">💊 Medicines</option>
              <option value="general">🧴 General</option>
            </select>
            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                    #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Company
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Size
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Potency
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    MRP
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((product, index) => {
                  const isLow = product.stock <= product.lowStockThreshold;
                  const isExpired =
                    product.expiryDate &&
                    new Date(product.expiryDate) < new Date();
                  return (
                    <tr
                      key={product._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {product.medicine ? "💊" : "🧴"}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">
                              {getDisplayName(product)}
                            </p>
                            {product.useTypes?.length > 0 && (
                              <div className="flex gap-1 mt-0.5">
                                {product.useTypes.slice(0, 2).map((ut) => (
                                  <span
                                    key={ut._id}
                                    className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
                                  >
                                    {ut.name}
                                  </span>
                                ))}
                                {product.useTypes.length > 2 && (
                                  <span className="text-[10px] text-gray-400">
                                    +{product.useTypes.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {product.company?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {product.category?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {product.size?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm hidden lg:table-cell">
                        {product.potency ? (
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                            {product.potency.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        ₹{product.mrp}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-semibold ${isLow ? "text-red-600" : "text-gray-800"}`}
                          >
                            {product.stock}
                          </span>
                          {isLow && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          {isExpired && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                              Expired
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isActive={product.isActive} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(product)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
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
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Product" : "Add New Product"}
        size="xl"
        footer={
          <>
            <button
              onClick={closeModal}
              disabled={submitting}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? "Update Product" : "Create Product"}
            </button>
          </>
        }
      >
        <ProductForm
          formData={formData}
          onChange={setFormData}
          errors={formErrors}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product?"
        itemName={deleteDialog.name}
        loading={deleting}
      />

      <ProductBulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}
