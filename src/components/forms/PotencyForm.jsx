"use client";

import FormField from "@/components/FormField";

const emptyForm = {
  name: "",
  scale: "CH",
  level: "",
  description: "",
  isActive: true,
};

export { emptyForm as emptyPotencyForm };

export default function PotencyForm({ formData, onChange, errors = {} }) {
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
        label="Potency Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., 30CH, 200CH, 1M, Q, 6X"
        required
        error={errors.name}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Scale"
          name="scale"
          type="select"
          value={formData.scale}
          onChange={handleChange}
          required
          options={[
            { value: "CH", label: "CH (Centesimal)" },
            { value: "C", label: "C (Centesimal)" },
            { value: "X", label: "X / D (Decimal)" },
            { value: "LM", label: "LM (50 Millesimal)" },
            { value: "Q", label: "Q (Mother Tincture)" },
            { value: "M", label: "M (Thousand Centesimal)" },
          ]}
          error={errors.scale}
        />

        <FormField
          label="Sort Level"
          name="level"
          type="number"
          value={formData.level}
          onChange={handleChange}
          placeholder="e.g., 30, 200, 1000"
          error={errors.level}
        />
      </div>

      <FormField
        label="Description"
        name="description"
        type="textarea"
        value={formData.description}
        onChange={handleChange}
        placeholder="Write a brief note about this potency standard..."
        rows={2}
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
