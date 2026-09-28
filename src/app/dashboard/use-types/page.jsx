"use client";

import { useState, useEffect, useCallback } from "react";
import useTypeService from "@/services/useTypeService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import UseTypeForm, { emptyUseTypeForm } from "@/components/forms/UseTypeForm";
import { Plus, Pencil, Trash2, Search, HeartPulse, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function UseTypesPage() {
  const [useTypes, setUseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyUseTypeForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);

  const fetchUseTypes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await useTypeService.getAll(params);
      if (res.success) {
        setUseTypes(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch indications");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUseTypes();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUseTypes]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyUseTypeForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (ut) => {
    setIsEditMode(true);
    setEditingId(ut._id);
    setFormData({
      name: ut.name || "",
      description: ut.description || "",
      isActive: ut.isActive !== undefined ? ut.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyUseTypeForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      if (isEditMode) {
        const res = await useTypeService.update(editingId, formData);
        if (res.success) {
          toast.success("Use type updated successfully");
          closeModal();
          fetchUseTypes();
        }
      } else {
        const res = await useTypeService.create(formData);
        if (res.success) {
          toast.success("Use type created successfully");
          closeModal();
          fetchUseTypes();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (ut) => {
    setDeleteDialog({ isOpen: true, id: ut._id, name: ut.name });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await useTypeService.delete(deleteDialog.id);
      if (res.success) {
        toast.success("Use type deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchUseTypes();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-green-700" />
            Use Types
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage common medical symptom categories and treatments (e.g., Cough, Joint Pain, Skin Care)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Use Type
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indications..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchUseTypes}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
            title="Refresh use types"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading indications...</span>
          </div>
        ) : useTypes.length === 0 ? (
          <div className="text-center py-20">
            <HeartPulse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No use types found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Indication Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {useTypes.map((ut, index) => (
                  <tr key={ut._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 text-sm">{ut.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{ut.description || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={ut.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(ut)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(ut)}
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
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={isEditMode ? "Edit Use Type" : "Add New Use Type"}
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
              {isEditMode ? "Update Use Type" : "Create Use Type"}
            </button>
          </>
        }
      >
        <UseTypeForm formData={formData} onChange={setFormData} errors={formErrors} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Use Type"
        message="Are you sure you want to delete this indication category?"
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}