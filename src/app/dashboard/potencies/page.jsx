"use client";

import { useState, useEffect, useCallback } from "react";
import potencyService from "@/services/potencyService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import PotencyForm, { emptyPotencyForm } from "@/components/forms/PotencyForm";
import { Plus, Pencil, Trash2, Search, Droplets, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function PotenciesPage() {
  const [potencies, setPotencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyPotencyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);

  const fetchPotencies = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await potencyService.getAll(params);
      if (res.success) {
        setPotencies(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch potencies");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPotencies();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPotencies]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyPotencyForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (potency) => {
    setIsEditMode(true);
    setEditingId(potency._id);
    setFormData({
      name: potency.name || "",
      scale: potency.scale || "CH",
      level: potency.level !== undefined ? potency.level : "",
      description: potency.description || "",
      isActive: potency.isActive !== undefined ? potency.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyPotencyForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Potency name is required";
    if (!formData.scale) errors.scale = "Scale is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      const payload = { ...formData, level: formData.level ? Number(formData.level) : 0 };

      if (isEditMode) {
        const res = await potencyService.update(editingId, payload);
        if (res.success) {
          toast.success("Potency updated successfully");
          closeModal();
          fetchPotencies();
        }
      } else {
        const res = await potencyService.create(payload);
        if (res.success) {
          toast.success("Potency created successfully");
          closeModal();
          fetchPotencies();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (potency) => {
    setDeleteDialog({ isOpen: true, id: potency._id, name: potency.name });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await potencyService.delete(deleteDialog.id);
      if (res.success) {
        toast.success("Potency deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchPotencies();
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
            <Droplets className="w-6 h-6 text-green-700" />
            Potencies
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage dilution strength and potency levels (e.g., 30CH, 200CH, 1M, Q)
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Potency
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
              placeholder="Search potencies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchPotencies}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
            title="Refresh potencies"
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
            <span className="ml-3 text-gray-500">Loading potencies...</span>
          </div>
        ) : potencies.length === 0 ? (
          <div className="text-center py-20">
            <Droplets className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No potencies found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scale</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sort Level</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {potencies.map((potency, index) => (
                  <tr key={potency._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800 text-sm bg-gray-100 px-2.5 py-1 rounded-md">
                        {potency.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{potency.scale}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{potency.level}</td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={potency.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(potency)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(potency)}
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
        title={isEditMode ? "Edit Potency" : "Add New Potency"}
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
              {isEditMode ? "Update Potency" : "Create Potency"}
            </button>
          </>
        }
      >
        <PotencyForm formData={formData} onChange={setFormData} errors={formErrors} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Potency"
        message="Are you sure you want to delete this potency strength?"
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}