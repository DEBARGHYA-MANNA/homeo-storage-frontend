"use client";

import { useState, useEffect, useCallback } from "react";
import categoryService from "@/services/categoryService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import BulkImportModal from "@/components/BulkImportModal";
import CategoryForm, {
  emptyCategoryForm,
} from "@/components/forms/CategoryForm";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Loader2,
  RefreshCw,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";

const categoryColumns = [
  { key: "name", label: "Category Name", required: true, example: "Dilution" },
  {
    key: "description",
    label: "Description",
    required: false,
    example: "Liquid dilutions in various potencies",
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyCategoryForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit };
      if (search) params.search = search;

      const res = await categoryService.getAll(params);
      if (res.success) {
        setCategories(res.data || []);

        // Map backend response properties (total, totalPages) directly
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
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(), 300);
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyCategoryForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setIsEditMode(true);
    setEditingId(category._id);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      isActive: category.isActive !== undefined ? category.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyCategoryForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Category name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      if (isEditMode) {
        const res = await categoryService.update(editingId, formData);
        if (res.success) {
          toast.success("Category updated successfully");
          closeModal();
          fetchCategories();
        }
      } else {
        const res = await categoryService.create(formData);
        if (res.success) {
          toast.success("Category created successfully");
          closeModal();
          fetchCategories();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (category) => {
    setDeleteDialog({ isOpen: true, id: category._id, name: category.name });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await categoryService.delete(deleteDialog.id);
      if (res.success) {
        toast.success("Category deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchCategories();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkImport = async (rows) => {
    let success = 0;
    let failed = 0;
    const errors = [];
    for (const row of rows) {
      try {
        const res = await categoryService.create(row);
        if (res.success) success++;
      } catch (error) {
        failed++;
        errors.push(
          `${row.name}: ${error.response?.data?.message || "Failed"}`,
        );
      }
    }
    fetchCategories();
    return { success, failed, errors };
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-green-700" />
            Categories
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Organize medicines and products into types (Dilution, Mother
            Tincture, Tablets, etc.)
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
            Add Category
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border text-slate-900 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table & Pagination Wrapper */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No categories found</p>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.map((category, index) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {(page - 1) * limit + index + 1}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                        {category.description || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isActive={category.isActive} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditModal(category)}
                            className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteDialog(category)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                categories
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Rows per page:</span>
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

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Category" : "Add New Category"}
        size="md"
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
              {isEditMode ? "Update Category" : "Create Category"}
            </button>
          </>
        }
      >
        <CategoryForm
          formData={formData}
          onChange={setFormData}
          errors={formErrors}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        itemName={deleteDialog.name}
        loading={deleting}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        title="Bulk Import Categories"
        columns={categoryColumns}
        onImport={handleBulkImport}
      />
    </div>
  );
}
