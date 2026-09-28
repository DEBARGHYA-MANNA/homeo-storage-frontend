"use client";

import { useState, useEffect, useCallback } from "react";
import sizeService from "@/services/sizeService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import SizeForm, { emptySizeForm } from "@/components/forms/SizeForm";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Ruler,
  Loader2,
  Filter,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SizesPage() {
  // ============================================
  // STATE
  // ============================================
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptySizeForm);
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
  // FETCH SIZES
  // ============================================
  const fetchSizes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (unitFilter) params.unit = unitFilter;

      const res = await sizeService.getAll(params);
      if (res.success) {
        setSizes(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch sizes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, unitFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSizes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSizes]);

  // ============================================
  // MODAL HANDLERS
  // ============================================
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptySizeForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (size) => {
    setIsEditMode(true);
    setEditingId(size._id);
    setFormData({
      name: size.name || "",
      volume: size.volume !== undefined ? size.volume : "",
      unit: size.unit || "ml",
      isActive: size.isActive !== undefined ? size.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptySizeForm);
    setFormErrors({});
  };

  // ============================================
  // FORM VALIDATION
  // ============================================
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Size name is required";
    }
    if (formData.volume === "" || formData.volume === null || Number(formData.volume) < 0) {
      errors.volume = "Valid volume/quantity is required";
    }
    if (!formData.unit) {
      errors.unit = "Unit is required";
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

      const payload = {
        ...formData,
        volume: Number(formData.volume),
      };

      if (isEditMode) {
        const res = await sizeService.update(editingId, payload);
        if (res.success) {
          toast.success(res.message || "Size updated successfully");
          closeModal();
          fetchSizes();
        }
      } else {
        const res = await sizeService.create(payload);
        if (res.success) {
          toast.success(res.message || "Size created successfully");
          closeModal();
          fetchSizes();
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
  const openDeleteDialog = (size) => {
    setDeleteDialog({
      isOpen: true,
      id: size._id,
      name: size.name,
    });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await sizeService.delete(deleteDialog.id);
      if (res.success) {
        toast.success(res.message || "Size deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchSizes();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete size"
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
            <Ruler className="w-6 h-6 text-green-700" />
            Sizes & Packagings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage volume packaging options (10 ml, 30 ml, 100 ml, 450 ml, 25 g,
            etc.)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800
                     text-white px-5 py-2.5 rounded-lg font-medium
                     transition shadow-sm shadow-green-700/20"
        >
          <Plus className="w-4 h-4" />
          Add Size
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sizes (e.g. 30 ml, 100)..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                   text-sm text-green-800
                   focus:outline-none focus:ring-2 focus:ring-green-500
                   focus:border-transparent"
            />
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg
                   text-sm focus:outline-none focus:ring-2 focus:ring-green-500
                   focus:border-transparent bg-white text-gray-700"
            >
              <option value="">All Units</option>
              <option value="ml">ml (Milliliters)</option>
              <option value="g">g (Grams)</option>
              <option value="l">l (Liters)</option>
              <option value="kg">kg (Kilograms)</option>
              <option value="pieces">pieces</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchSizes}
            disabled={loading}
            className="flex shrink-0 items-center justify-center gap-2
                 px-4 py-2 border border-gray-200 rounded-lg
                 text-gray-600 hover:bg-green-50 hover:text-green-700
                 hover:border-green-200 transition
                 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh sizes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sizes Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading sizes...</span>
          </div>
        ) : sizes.length === 0 ? (
          <div className="text-center py-20">
            <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />

            <p className="text-gray-500 font-medium">No sizes found</p>

            <p className="text-gray-400 text-sm mt-1">
              Click &ldquo;Add Size&rdquo; to create your first packaging size
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
                    Display Name
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Volume / Quantity
                  </th>

                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Unit
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
                {sizes.map((size, index) => (
                  <tr key={size._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {index + 1}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 text-sm bg-gray-100 px-2.5 py-1 rounded-md">
                        {size.name}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {size.volume}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600 uppercase">
                      {size.unit}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge isActive={size.isActive} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(size)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => openDeleteDialog(size)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
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
        title={isEditMode ? "Edit Packaging Size" : "Add New Packaging Size"}
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
              {isEditMode ? "Update Size" : "Create Size"}
            </button>
          </>
        }
      >
        <SizeForm
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
        title="Delete Size"
        message="Are you sure you want to delete this packaging size?"
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}