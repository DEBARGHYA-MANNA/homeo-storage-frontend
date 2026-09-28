"use client";

export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  error = "",
  options = [], // For select type
  rows = 3, // For textarea type
  disabled = false,
}) {
  const baseInputClass = `
    w-full px-3 py-2.5 border rounded-lg text-sm
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
    transition duration-200
    ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
    ${disabled ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "text-gray-800"}
    placeholder:text-gray-400
  `;

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`${baseInputClass} resize-none`}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={baseInputClass}
        >
          <option value="">{placeholder || "Select an option"}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={baseInputClass}
        />
      )}

      {/* Error Message */}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
