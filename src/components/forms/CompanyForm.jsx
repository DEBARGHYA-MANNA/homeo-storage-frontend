"use client";

import FormField from "@/components/FormField";

const emptyForm = {
  name: "",
  description: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  country: "India",
  isActive: true,
};

export { emptyForm as emptyCompanyForm };

export default function CompanyForm({ formData, onChange, errors = {} }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Company Name */}
      <div className="md:col-span-2">
        <FormField
          label="Company Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., SBL, Dr. Reckeweg"
          required
          error={errors.name}
        />
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <FormField
          label="Description"
          name="description"
          type="textarea"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description about the company"
          rows={2}
        />
      </div>

      {/* Contact Person */}
      <FormField
        label="Contact Person"
        name="contactPerson"
        value={formData.contactPerson}
        onChange={handleChange}
        placeholder="e.g., Mr. Sharma"
      />

      {/* Phone */}
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={handleChange}
        placeholder="e.g., 011-23456789"
      />

      {/* Email */}
      <FormField
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="e.g., info@sbl.com"
        error={errors.email}
      />

      {/* Country */}
      <FormField
        label="Country"
        name="country"
        type="select"
        value={formData.country}
        onChange={handleChange}
        options={[
          { value: "India", label: "India" },
          { value: "Germany", label: "Germany" },
          { value: "USA", label: "USA" },
          { value: "UK", label: "UK" },
          { value: "France", label: "France" },
          { value: "Other", label: "Other" },
        ]}
      />

      {/* Address */}
      <div className="md:col-span-2">
        <FormField
          label="Address"
          name="address"
          type="textarea"
          value={formData.address}
          onChange={handleChange}
          placeholder="Full address"
          rows={2}
        />
      </div>

      {/* Active Status */}
      <div className="md:col-span-2 flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">
          Active
        </label>
      </div>
    </div>
  );
}
