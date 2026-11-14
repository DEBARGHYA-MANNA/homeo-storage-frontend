"use client";

export default function StockInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder = "",
  required = false,
  disabled = false,
  prefix = "",
  suffix = "",
  min,
  max,
  step,
  hint = "",
  error = "",
  autoFocus = false,
}) {
  // ============================================
  // Prevent scroll wheel from changing number inputs
  // ============================================
  const handleWheel = (e) => {
    if (type === "number") {
      e.target.blur();
    }
  };

  // Prevent up/down arrow keys from changing numbers (optional)
  const handleKeyDown = (e) => {
    if (type === "number" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-gray-600 uppercase tracking-wide"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium z-10 pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          autoFocus={autoFocus}
          className={`
            w-full py-2.5 border-2 rounded-lg text-sm font-medium
            transition duration-200
            focus:outline-none focus:ring-0
            ${prefix ? "pl-8" : "pl-3"}
            ${suffix ? "pr-12" : "pr-3"}
            ${
              disabled
                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                : error
                  ? "bg-red-50 border-red-300 text-red-800 focus:border-red-500"
                  : "bg-gray-50 border-gray-300 text-gray-900 focus:border-green-500 focus:bg-white"
            }
            placeholder:text-gray-400 placeholder:font-normal
            [appearance:textfield]
            [&::-webkit-outer-spin-button]:appearance-none
            [&::-webkit-inner-spin-button]:appearance-none
          `}
        />
        {suffix && typeof suffix === "string" ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {suffix}
          </span>
        ) : suffix ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        ) : null}
      </div>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
