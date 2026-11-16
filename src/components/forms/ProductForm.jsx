"use client";

import { useState, useEffect } from "react";
import FormField from "@/components/FormField";
import MultiSelect from "@/components/MultiSelect";
import referenceService from "@/services/referenceService";
import { Loader2, Pill, FlaskConical } from "lucide-react";

const emptyForm = {
  productType: "medicine",
  medicine: "",
  productName: "",
  company: [],
  category: "",
  size: [],
  potency: "",
  useTypes: [],
  lowStockThreshold: "12",
  hsnCode: "",
};

export { emptyForm as emptyProductForm };

export default function ProductForm({ formData, onChange, errors = {} }) {
  const [refs, setRefs] = useState({
    medicines: [],
    companies: [],
    categories: [],
    sizes: [],
    potencies: [],
    useTypes: [],
  });
  const [loadingRefs, setLoadingRefs] = useState(true);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        setLoadingRefs(true);
        const [medicines, companies, categories, sizes, potencies, useTypes] =
          await Promise.all([
            referenceService.getMedicines(),
            referenceService.getCompanies(),
            referenceService.getCategories(),
            referenceService.getSizes(),
            referenceService.getPotencies(),
            referenceService.getUseTypes(),
          ]);
        setRefs({
          medicines,
          companies,
          categories,
          sizes,
          potencies,
          useTypes,
        });
      } catch (error) {
        console.error("Failed to load reference data:", error);
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    if (name === "productType") {
      if (value === "general") {
        updated.medicine = "";
        updated.potency = "";
      } else {
        updated.productName = "";
      }
    }

    onChange(updated);
  };

  const handleCompanyChange = (selectedIds) => {
    onChange({ ...formData, company: selectedIds });
  };

  const handleSizeChange = (selectedIds) => {
    onChange({ ...formData, size: selectedIds });
  };

  const handleUseTypeChange = (selectedIds) => {
    onChange({ ...formData, useTypes: selectedIds });
  };

  if (loadingRefs) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
        <span className="text-gray-500">Loading form data...</span>
      </div>
    );
  }

  const isMedicine = formData.productType === "medicine";

  return (
    <div className="space-y-5">
      {/* Product Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() =>
              handleChange({
                target: { name: "productType", value: "medicine" },
              })
            }
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition
              ${
                isMedicine
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
          >
            <Pill className="w-4 h-4" />
            Medicine Product
          </button>
          <button
            type="button"
            onClick={() =>
              handleChange({
                target: { name: "productType", value: "general" },
              })
            }
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition
              ${
                !isMedicine
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
          >
            <FlaskConical className="w-4 h-4" />
            General Product
          </button>
        </div>
      </div>

      {/* Identity Configuration */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Identity & Description
        </h3>

        {isMedicine ? (
          <FormField
            label="Medicine / Remedy"
            name="medicine"
            type="select"
            value={formData.medicine}
            onChange={handleChange}
            placeholder="Select a medicine..."
            required
            error={errors.medicine}
            options={refs.medicines.map((m) => ({
              value: m._id,
              label: `${m.name}${m.shortName ? ` (${m.shortName})` : ""}`,
            }))}
          />
        ) : (
          <FormField
            label="Product Name"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            placeholder="e.g., Anti-Dandruff Shampoo, Jaborandi Hair Oil"
            required
            error={errors.productName}
          />
        )}
      </div>

      {/* Categorization & Masters */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Classification
        </h3>

        {/* Company — MultiSelect (1 or more) */}
        <div className="mb-4 relative">
          <MultiSelect
            label="Company"
            options={refs.companies}
            selected={formData.company}
            onChange={handleCompanyChange}
            placeholder="Select company(s)..."
            required
            error={errors.company}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleChange}
            placeholder="Select category..."
            required
            error={errors.category}
            options={refs.categories.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
          />

          {isMedicine && (
            <FormField
              label="Potency"
              name="potency"
              type="select"
              value={formData.potency}
              onChange={handleChange}
              placeholder="Select potency..."
              error={errors.potency}
              options={refs.potencies.map((p) => ({
                value: p._id,
                label: p.name,
              }))}
            />
          )}
        </div>

        {/* Size — MultiSelect */}
        <div className="mt-4 relative">
          <MultiSelect
            label="Size / Packaging"
            options={refs.sizes}
            selected={formData.size}
            onChange={handleSizeChange}
            placeholder="Select size(s)..."
            required
            error={errors.size}
          />
        </div>

        {/* Use Types — MultiSelect */}
        <div className="mt-4 relative">
          <MultiSelect
            label="Use Types / Indications"
            options={refs.useTypes}
            selected={formData.useTypes}
            onChange={handleUseTypeChange}
            placeholder="Select use types (Cold, Cough, etc.)..."
          />
        </div>
      </div>

      {/* Threshold & Compliance */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Settings & Compliance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Low Stock Alert Threshold"
            name="lowStockThreshold"
            type="number"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            placeholder="10"
          />

          <FormField
            label="HSN Code"
            name="hsnCode"
            value={formData.hsnCode}
            onChange={handleChange}
            placeholder="3004"
          />
        </div>
      </div>
    </div>
  );
}
