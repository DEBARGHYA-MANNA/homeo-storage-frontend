"use client";

import FormField from "@/components/FormField";

const emptyForm = {
  name: "",
  volume: "",
  unit: "ml",
  isActive: true,
};

export { emptyForm as emptySizeForm };

export default function SizeForm({ formData, onChange, errors = {} }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updated = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };

    // Auto-generate display name if user enters volume or unit
    if (name === "volume" || name === "unit") {
      const vol = name === "volume" ? value : formData.volume;
      const un = name === "unit" ? value : formData.unit;
      if (vol && un) {
        updated.name = `${vol} ${un}`;
      }
    }

    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Volume & Unit Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Numeric Volume */}
        <FormField
          label="Volume / Quantity"
          name="volume"
          type="number"
          value={formData.volume}
          onChange={handleChange}
          placeholder="e.g., 30, 100, 450"
          required
          error={errors.volume}
        />

        {/* Unit Dropdown */}
        <FormField
          label="Unit"
          name="unit"
          type="select"
          value={formData.unit}
          onChange={handleChange}
          required
          error={errors.unit}
          options={[
            { value: "ml", label: "ml (Milliliters)" },
            { value: "g", label: "g (Grams)" },
            { value: "l", label: "l (Liters)" },
            { value: "kg", label: "kg (Kilograms)" },
            { value: "pieces", label: "pieces (Pcs)" },
          ]}
        />
      </div>

      {/* Display Name */}
      <FormField
        label="Display Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="e.g., 30 ml, 100 ml, 25 g"
        required
        error={errors.name}
      />
      <p className="text-xs text-gray-400 -mt-2">
        * Auto-fills from Volume + Unit, or you can customize it.
      </p>

      {/* Active Status */}
      <div className="flex items-center gap-2 pt-2">
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
