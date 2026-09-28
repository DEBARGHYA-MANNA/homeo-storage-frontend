"use client";

import { useState, useEffect, useCallback } from "react";
import companyService from "@/services/companyService";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import StatusBadge from "@/components/StatusBadge";
import CompanyForm, { emptyCompanyForm } from "@/components/forms/CompanyForm";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CompaniesPage() {
  // ============================================
  // STATE
  // ============================================
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyCompanyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    id: null,
    name: "",
  });
  const [deleting, setDeleting] = useState(false);

  // ============================================
  // FETCH COMPANIES
  // ============================================
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      const res = await companyService.getAll(params);
      if (res.success) {
        setCompanies(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch companies");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchCompanies]);

  // ============================================
  // OPEN MODAL - ADD
  // ============================================
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(emptyCompanyForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // ============================================
  // OPEN MODAL - EDIT
  // ============================================
  const openEditModal = (company) => {
    setIsEditMode(true);
    setEditingId(company._id);
    setFormData({
      name: company.name || "",
      description: company.description || "",
      contactPerson: company.contactPerson || "",
      phone: company.phone || "",
      email: company.email || "",
      address: company.address || "",
      country: company.country || "India",
      isActive: company.isActive !== undefined ? company.isActive : true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // ============================================
  // CLOSE MODAL
  // ============================================
  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(emptyCompanyForm);
    setFormErrors({});
  };

  // ============================================
  // VALIDATE FORM
  // ============================================
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Company name is required";
    }
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ============================================
  // SUBMIT FORM (Create or Update)
  // ============================================
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      if (isEditMode) {
        // UPDATE
        const res = await companyService.update(editingId, formData);
        if (res.success) {
          toast.success(res.message || "Company updated successfully");
          closeModal();
          fetchCompanies();
        }
      } else {
        // CREATE
        const res = await companyService.create(formData);
        if (res.success) {
          toast.success(res.message || "Company created successfully");
          closeModal();
          fetchCompanies();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // DELETE COMPANY
  // ============================================
  const openDeleteDialog = (company) => {
    setDeleteDialog({
      isOpen: true,
      id: company._id,
      name: company.name,
    });
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await companyService.delete(deleteDialog.id);
      if (res.success) {
        toast.success(res.message || "Company deleted successfully");
        setDeleteDialog({ isOpen: false, id: null, name: "" });
        fetchCompanies();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-green-700" />
            Companies
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your homeopathic medicine suppliers and manufacturers
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-green-700 hover:bg-green-800
                     text-white px-5 py-2.5 rounded-lg font-medium
                     transition shadow-sm shadow-green-700/20"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-900" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg
                   text-sm text-green-800 focus:outline-none focus:ring-2
                   focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchCompanies}
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

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            <span className="ml-3 text-gray-500">Loading companies...</span>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No companies found</p>
            <p className="text-gray-400 text-sm mt-1">
              Click &ldquo;Add Company&rdquo; to get started
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Company Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Country
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {companies.map((company, index) => (
                  <tr key={company._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-800">
                        {company.name}
                      </p>
                      {company.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                          {company.description}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700">
                        {company.contactPerson || "-"}
                      </p>
                      {company.phone && (
                        <p className="text-xs text-gray-400">{company.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      {company.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 hidden lg:table-cell">
                      {company.country || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge isActive={company.isActive} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(company)}
                          className="p-2 rounded-lg hover:bg-blue-50
                                     text-blue-600 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => openDeleteDialog(company)}
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
        title={isEditMode ? "Edit Company" : "Add New Company"}
        size="lg"
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
              {isEditMode ? "Update Company" : "Create Company"}
            </button>
          </>
        }
      >
        <CompanyForm
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
        title="Delete Company"
        message="Are you sure you want to delete this company?"
        itemName={deleteDialog.name}
        loading={deleting}
      />
    </div>
  );
}
