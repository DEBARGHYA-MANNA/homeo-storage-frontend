"use client";

import { useState, useEffect, useCallback } from "react";
import medicineService from "@/services/medicineService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import BulkImportModal from "@/components/BulkImportModal";
import MedicineForm, { emptyMedicineForm } from "@/components/forms/MedicineForm";
import { Plus, Pencil, Trash2, Search, Pill, Loader2, RefreshCw, Upload } from "lucide-react";
import toast from "react-hot-toast";

const medicineColumns = [
  { key: "name", label: "Medicine Name", required: true, example: "Arnica Montana" },
  { key: "shortName", label: "Short Name", required: false, example: "Arnica" },
  { key: "commonUses", label: "Common Uses", required: false, example: "Injuries, bruises, muscle pain" },
];

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyMedicineForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: "" });
  const [deleting, setDeleting] = useState(false);

  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await medicineService.getAll(params);
      if (res.success) setMedicines(res.data);
    } catch (error) {
      toast.error("Failed to fetch remedies");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMedicines(), 300);
    return () => clearTimeout(timer);
  }, [fetchMedicines]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyMedicineForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (med) => {
    setIsEditMode(true);
    setEditingId(med._id);
    setFormData({
      name: med.name || "",
      shortName: med.shortName || "",
      commonUses: med.commonUses || "",
      isActive: med.isActive !== undefined ? med.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyMedicineForm);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Medicine name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      if (isEditMode) {
        const res = await medicineService.update(editingId, formData);
        if (res.success) {
          toast.success("Medicine updated successfully");
          closeModal();
          fetchMedicines();
        }
      } else {
        const res = await medicineService.create(formData);
        if (res.success) {
          toast.success("Medicine created successfully");
          closeModal();
          fetchMedicines();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (med) => {
    setDeleteDialog({ isOpen: true, id: med._id, name: med.name });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await medicineService.delete(deleteDialog.id);
      if (res.success) {
        toast.success("Medicine deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchMedicines();
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
        const res = await medicineService.create(row);
        if (res.success) success++;
      } catch (error) {
        failed++;
        errors.push(`${row.name}: ${error.response?.data?.message || "Failed"}`);
      }
    }
    fetchMedicines();
    return { success, failed, errors };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-green-700" />
            Medicines
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your catalog of homeopathic source remedies and botanicals
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
            Add Medicine
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
              placeholder="Search remedies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={fetchMedicines}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition disabled:opacity-50"
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
            <span className="ml-3 text-gray-500">Loading remedies...</span>
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-20">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No medicines found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">#</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remedy Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Short Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Uses</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {medicines.map((med, index) => (
                  <tr key={med._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800 text-sm">{med.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.shortName || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{med.commonUses || "-"}</td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={med.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEditModal(med)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => openDeleteDialog(med)} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition">
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
        title={isEditMode ? "Edit Medicine" : "Add New Medicine"}
        size="lg"
        footer={
          <>
            <button onClick={closeModal} disabled={submitting} className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition disabled:opacity-50">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditMode ? "Update Medicine" : "Create Medicine"}
            </button>
          </>
        }
      >
        <MedicineForm formData={formData} onChange={setFormData} errors={formErrors} />
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: "" })}
        onConfirm={handleDelete}
        title="Delete Medicine"
        message="Are you sure you want to delete this remedy?"
        itemName={deleteDialog.name}
        loading={deleting}
      />

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        title="Bulk Import Medicines"
        columns={medicineColumns}
        onImport={handleBulkImport}
      />
    </div>
  );
}