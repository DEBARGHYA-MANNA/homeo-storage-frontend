"use client";

import FormField from "@/components/FormField";

const emptyForm = {
  name: "",
  shortName: "",
  commonUses: "",
  isActive: true,
};

export { emptyForm as emptyMedicineForm };

export default function MedicineForm({ formData, onChange, errors = {} }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Remedy Name (Full)"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Arnica Montana"
          required
          error={errors.name}
        />

        <FormField
          label="Short Name / Alias"
          name="shortName"
          value={formData.shortName}
          onChange={handleChange}
          placeholder="e.g., Arnica"
        />
      </div>

      <FormField
        label="Common Indications / Uses"
        name="commonUses"
        type="textarea"
        value={formData.commonUses}
        onChange={handleChange}
        placeholder="Brief description of symptoms this remedy covers..."
        rows={3}
      />

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>
    </div>
  );
}
