"use client";

import FormField from "@/components/FormField";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

export { emptyForm as emptyUseTypeForm };

export default function UseTypeForm({ formData, onChange, errors = {} }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Use Type / Indication"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., Cold, Cough, Muscle Pain, Hair Care"
        required
        error={errors.name}
      />

      <FormField
        label="Description / Details"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Which symptoms or diagnostic purposes are linked..."
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
