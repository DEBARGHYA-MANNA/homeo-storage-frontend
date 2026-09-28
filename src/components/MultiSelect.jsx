"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Search } from "lucide-react";

export default function MultiSelect({
  label,
  options = [],       // [{ _id, name }]
  selected = [],      // array of IDs
  onChange,
  placeholder = "Select...",
  required = false,
  error = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const handleRemove = (id) => {
    onChange(selected.filter((s) => s !== id));
  };

  const selectedNames = options
    .filter((opt) => selected.includes(opt._id))
    .map((opt) => opt.name);

  return (
    <div className="space-y-1.5" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedNames.map((name, i) => (
            <span
              key={selected[i]}
              className="inline-flex items-center gap-1 bg-green-100 text-green-700
                         text-xs font-medium px-2 py-1 rounded-md"
            >
              {name}
              <button
                type="button"
                onClick={() => handleRemove(selected[i])}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm
          transition duration-200 text-left
          ${error ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}
          ${isOpen ? "ring-2 ring-green-500 border-transparent" : ""}
        `}
      >
        <span className={selected.length === 0 ? "text-gray-400" : "text-gray-700"}>
          {selected.length === 0
            ? placeholder
            : `${selected.length} selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search inside dropdown */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded
                           focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-40">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">No options found</p>
            ) : (
              filteredOptions.map((opt) => (
                <label
                  key={opt._id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(opt._id)}
                    onChange={() => handleToggle(opt._id)}
                    className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{opt.name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}