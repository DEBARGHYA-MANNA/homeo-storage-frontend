"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";

// Single select dropdown for grid cell
export function GridSelectCell({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selected = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full min-w-[130px] flex items-center justify-between
          px-2 py-1.5 border rounded text-xs text-left transition
          ${disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white border-gray-200 hover:border-gray-300"}
          ${isOpen ? "ring-1 ring-green-500 border-green-500" : ""}
        `}
      >
        <span className={`truncate ${selected ? "text-gray-800" : "text-gray-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 ml-1 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-hidden">
          <div className="p-1.5 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearch("");
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:bg-gray-50 italic"
            >
              -- Clear --
            </button>
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No matches</p>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-1.5 text-xs text-left
                    hover:bg-green-50 transition
                    ${value === opt.value ? "bg-green-50 text-green-700 font-medium" : "text-gray-700"}
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-3 h-3 text-green-600 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Multi-select dropdown for grid cell (for Use Types)
export function GridMultiSelectCell({
  value = [],
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItems = options.filter((opt) => value.includes(opt.value));

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full min-w-[150px] flex items-center justify-between
          px-2 py-1.5 border rounded text-xs text-left transition
          ${disabled
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white border-gray-200 hover:border-gray-300"}
          ${isOpen ? "ring-1 ring-green-500 border-green-500" : ""}
        `}
      >
        <span className={`truncate ${selectedItems.length > 0 ? "text-gray-800" : "text-gray-400"}`}>
          {selectedItems.length === 0
            ? placeholder
            : `${selectedItems.length} selected`}
        </span>
        <ChevronDown className={`w-3 h-3 text-gray-400 flex-shrink-0 ml-1 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-hidden">
          <div className="p-1.5 border-b bg-gray-50">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search use types..."
                className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                autoFocus
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">No matches</p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`
                      w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left
                      hover:bg-green-50 transition
                      ${isSelected ? "bg-green-50 text-green-700" : "text-gray-700"}
                    `}
                  >
                    <div className={`
                      w-3.5 h-3.5 border rounded flex items-center justify-center flex-shrink-0
                      ${isSelected ? "bg-green-600 border-green-600" : "border-gray-300"}
                    `}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}