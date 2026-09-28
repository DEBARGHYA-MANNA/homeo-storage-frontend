"use client";

import { useState, useEffect, useCallback } from "react";
import categoryService from "@/services/categoryService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import CategoryForm, { emptyCategoryForm } from "@/components/forms/CategoryForm";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  // ============================================
  // STATE
  // ============================================
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyCategoryForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // FETCH CATEGORIES
  // ============================================
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await categoryService.getAll(params);
      if (res.success) {
        setCategories(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories();
    }, 300); // 300ms debounce for search input
    return () => clearTimeout(timer);
  }, [fetchCategories]);

  // ============================================
  // MODAL HANDLERS
  // ============================================
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

  // ============================================
  // FORM VALIDATION
  // ============================================
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Category name is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================
  // FORM SUBMIT (Create or Update)
  // ============================================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (isEditMode) {
        const res = await categoryService.update(editingId, formData);
        if (res.success) {
          toast.success(res.message || "Category updated successfully");
          closeModal();
          fetchCategories();
        }
      } else {
        const res = await categoryService.create(formData);
        if (res.success) {
          toast.success(res.message || "Category created successfully");
          closeModal();
          fetchCategories();
        }
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // DELETE HANDLERS
  // ============================================
  const openDeleteDialog = (category) => {
    setDeleteDialog({
      isOpen: true,
      id: category._id,
      name: category.name,
    });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await categoryService.delete(deleteDialog.id);
      if (res.success) {
        toast.success(res.message || "Category deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchCategories();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete category"
      );
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER UI
  // ============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
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
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800
                     text-white px-5 py-2.5 rounded-lg font-medium
                     transition shadow-sm shadow-green-700/20"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                       text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                       focus:border-transparent"
            />
          </div>
          {/* Refresh Button */}
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2
                 border border-gray-200 rounded-lg text-gray-600
                 hover:bg-green-50 hover:text-green-700
                 hover:border-green-200 transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh companies"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Categories Table */}
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
            <p className="text-gray-400 text-sm mt-1">
              Click &ldquo;Add Category&rdquo; to create your first category
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
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
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {category.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={category.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 rounded-lg hover:bg-blue-50
                                     text-blue-600 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => openDeleteDialog(category)}
                          className="p-2 rounded-lg hover:bg-red-50
                                     text-red-600 transition"
                          title="Delete"
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
        )}
      </div>

      {/* ============================================ */}
      {/* ADD / EDIT MODAL                             */}
      {/* ============================================ */}
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
              className="px-5 py-2.5 border border-gray-300 rounded-lg
                         text-sm font-medium text-gray-700
                         hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700
                         text-white rounded-lg text-sm font-medium
                         hover:bg-green-800 transition disabled:opacity-50"
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

      {/* ============================================ */}
      {/* DELETE CONFIRMATION DIALOG                   */}
      {/* ============================================ */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category?"
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}