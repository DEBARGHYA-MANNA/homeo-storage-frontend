"use client";

import { useState, useEffect } from "react";
import FormField from "@/components/FormField";
import MultiSelect from "@/components/MultiSelect";
import referenceService from "@/services/referenceService";
import { Loader2, Pill, FlaskConical, BookmarkCheck } from "lucide-react";

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
  keepCompanyAndCategory: false,
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
          medicines: medicines || [],
          companies: companies || [],
          categories: categories || [],
          sizes: sizes || [],
          potencies: potencies || [],
          useTypes: useTypes || [],
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

  const handleMultiChange = (fieldName, selectedIds) => {
    onChange({ ...formData, [fieldName]: selectedIds });
  };

  if (loadingRefs) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-green-700 animate-spin mr-2.5" />
        <span className="text-gray-600 text-sm font-medium">
          Loading catalog masters...
        </span>
      </div>
    );
  }

  const isMedicine = formData.productType === "medicine";

  return (
    <div className="space-y-5 text-gray-800">
      {/* Product Type Toggle */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
          Product Classification <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() =>
              handleChange({
                target: { name: "productType", value: "medicine" },
              })
            }
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
              isMedicine
                ? "border-green-600 bg-green-50 text-green-800 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <Pill className="w-4 h-4 text-green-600" />
            Medicine Product
          </button>
          <button
            type="button"
            onClick={() =>
              handleChange({
                target: { name: "productType", value: "general" },
              })
            }
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
              !isMedicine
                ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FlaskConical className="w-4 h-4 text-blue-600" />
            General Product
          </button>
        </div>
      </div>

      {/* Identity Configuration */}
      <div className="border-t pt-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
          Item Information
        </h3>

        {isMedicine ? (
          <FormField
            label="Medicine / Remedy Name"
            name="medicine"
            type="select"
            value={formData.medicine}
            onChange={handleChange}
            placeholder="Select a medicine from catalog..."
            required
            error={errors.medicine}
            options={refs.medicines.map((m) => ({
              value: m._id,
              label: `${m.name}${m.shortName ? ` (${m.shortName})` : ""}`,
            }))}
          />
        ) : (
          <FormField
            label="Product Title"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
            placeholder="e.g., Arnica Hair Oil, Spondylitis Drops"
            required
            error={errors.productName}
          />
        )}
      </div>

      {/* Categorization & Masters */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
          Manufacturer & Attributes
        </h3>

        {/* Company Selection */}
        <div className="relative">
          <MultiSelect
            label="Company / Brand"
            options={refs.companies}
            selected={formData.company}
            onChange={(val) => handleMultiChange("company", val)}
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

        {/* Size Selection */}
        <div className="relative">
          <MultiSelect
            label="Size / Packaging Volume"
            options={refs.sizes}
            selected={formData.size}
            onChange={(val) => handleMultiChange("size", val)}
            placeholder="Select size(s)..."
            required
            error={errors.size}
          />
        </div>

        {/* Use Types Selection */}
        <div className="relative">
          <MultiSelect
            label="Use Types / Medical Indications"
            options={refs.useTypes}
            selected={formData.useTypes}
            onChange={(val) => handleMultiChange("useTypes", val)}
            placeholder="Select indications"
          />
        </div>
      </div>

      {/* Settings & Fast Entry Options */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Inventory Alert & Compliance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Low Stock Alert Threshold"
            name="lowStockThreshold"
            type="number"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            placeholder="12"
          />

          <FormField
            label="HSN Code"
            name="hsnCode"
            value={formData.hsnCode}
            onChange={handleChange}
            onWheel={(e) => e.target.blur()}
            placeholder="3004"
          />
        </div>

        {/* Fast Entry Helper Checkbox */}
        <div className="flex items-center gap-2.5 bg-green-50/70 border border-green-200 rounded-lg p-3 mt-2">
          <input
            type="checkbox"
            id="keepCompanyAndCategory"
            name="keepCompanyAndCategory"
            checked={formData.keepCompanyAndCategory || false}
            onChange={handleChange}
            className="w-4 h-4 text-green-700 border-gray-300 rounded focus:ring-green-500"
          />
          <label
            htmlFor="keepCompanyAndCategory"
            className="text-xs font-medium text-green-900 cursor-pointer flex items-center gap-1.5"
          >
            <BookmarkCheck className="w-4 h-4 text-green-700" />
            Keep selected Company & Category for next product registration
          </label>
        </div>
      </div>
    </div>
  );
}
