"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import referenceService from "@/services/referenceService";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  X,
  Loader2,
  Pill,
  FlaskConical,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";

const createEmptyRow = (defaults = {}) => ({
  id: crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9),
  productType: defaults.productType || "medicine",
  medicine: "",
  productName: "",
  company: [...(defaults.company || [])],
  category: defaults.category || "",
  size: [...(defaults.size || [])],
  potency: defaults.productType === "general" ? "" : defaults.potency || "",
  useTypes: [...(defaults.useTypes || [])],
  lowStockThreshold: defaults.lowStockThreshold ?? "12",
});

/**
 * Searchable Single-Select Dropdown (Medicine, Category, Potency)
 */
function SearchableSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select...",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, search]);

  if (disabled) {
    return (
      <div className="w-full px-3 py-2 text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded-lg cursor-not-allowed">
        N/A for Patents
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 focus-within:ring-2 focus-within:ring-green-600 focus-within:border-green-600"
      >
        <span
          className={`truncate ${
            selectedOption ? "text-slate-900 font-semibold" : "text-slate-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-slate-400 hover:text-red-600 p-0.5"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to search..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:ring-2 focus:ring-green-600 outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-green-50 text-green-950 font-bold"
                        : "bg-white text-slate-900 font-medium hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-green-700 shrink-0" />
                    )}
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

/**
 * Searchable Multi-Select Dropdown (Company, Size, Use Types)
 */
function SearchableMultiSelect({
  selected = [],
  options = [],
  onChange,
  placeholder = "Select options...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedOptions = useMemo(
    () =>
      options.map((opt) => ({
        value: opt._id || opt.value,
        label: opt.name || opt.label,
      })),
    [options],
  );

  const selectedItems = useMemo(
    () => normalizedOptions.filter((o) => selected.includes(o.value)),
    [normalizedOptions, selected],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    const q = search.toLowerCase();
    return normalizedOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [normalizedOptions, search]);

  const toggleValue = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter((item) => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5">
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <span
              key={item.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-950 border border-green-300"
            >
              {item.label}
              <button
                type="button"
                onClick={() => toggleValue(item.value)}
                className="text-green-800 hover:text-red-600 focus:outline-none"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1 px-2.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg hover:border-slate-400 focus:ring-2 focus:ring-green-600 outline-none"
      >
        <span className="truncate text-slate-700 font-medium">
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-600 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search options..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:ring-2 focus:ring-green-600 outline-none"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-500 text-center">
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = selected.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleValue(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition ${
                      isChecked
                        ? "bg-green-50 text-green-950 font-bold"
                        : "bg-white text-slate-900 font-medium hover:bg-slate-100"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border ${
                        isChecked
                          ? "bg-green-600 border-green-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
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

export default function ProductBulkImportModal({ isOpen, onClose, onImport }) {
  const [refs, setRefs] = useState({
    medicines: [],
    companies: [],
    categories: [],
    sizes: [],
    potencies: [],
    useTypes: [],
  });
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [rows, setRows] = useState([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [defaults, setDefaults] = useState({
    productType: "medicine",
    company: [],
    category: "",
    size: [],
    potency: "",
    useTypes: [],
    lowStockThreshold: "12",
  });

  useEffect(() => {
    if (!isOpen) return;
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
      } catch (err) {
        console.error("Failed to load reference data:", err);
        setError(
          "Failed to load catalog masters. Please refresh and try again.",
        );
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, [isOpen]);

  const medicineOptions = useMemo(
    () =>
      refs.medicines.map((m) => ({
        value: m._id,
        label: `${m.name}${m.shortName ? ` (${m.shortName})` : ""}`,
      })),
    [refs.medicines],
  );

  const categoryOptions = useMemo(
    () =>
      refs.categories.map((c) => ({
        value: c._id,
        label: c.name,
      })),
    [refs.categories],
  );

  const potencyOptions = useMemo(
    () =>
      refs.potencies.map((p) => ({
        value: p._id,
        label: p.name,
      })),
    [refs.potencies],
  );

  if (!isOpen) return null;

  const handleRowChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "productType") {
          if (value === "general") {
            updated.medicine = "";
            updated.potency = "";
          } else {
            updated.productName = "";
          }
        }
        return updated;
      }),
    );
  };

  const addRows = (count = 1) => {
    const newRows = Array.from({ length: count }, () =>
      createEmptyRow(defaults),
    );
    setRows((prev) => [...prev, ...newRows]);
  };

  const duplicateRow = (index) => {
    const source = rows[index];
    const cloned = {
      ...source,
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 9),
      company: [...source.company],
      size: [...source.size],
      useTypes: [...source.useTypes],
    };
    const updated = [...rows];
    updated.splice(index + 1, 0, cloned);
    setRows(updated);
  };

  const removeRow = (id) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const applyDefaultsToAll = () => {
    setRows((prev) =>
      prev.map((row) => {
        const nextType = defaults.productType || row.productType;
        return {
          ...row,
          productType: nextType,
          medicine: nextType === "general" ? "" : row.medicine,
          productName: nextType === "medicine" ? "" : row.productName,
          company: defaults.company.length
            ? [...defaults.company]
            : row.company,
          category: defaults.category || row.category,
          size: defaults.size.length ? [...defaults.size] : row.size,
          potency:
            nextType === "general" ? "" : defaults.potency || row.potency,
          useTypes: defaults.useTypes.length
            ? [...defaults.useTypes]
            : row.useTypes,
          lowStockThreshold:
            defaults.lowStockThreshold ?? row.lowStockThreshold,
        };
      }),
    );
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const findIdByName = (list, name) => {
      if (!name) return "";
      const q = name.trim().toLowerCase();
      const found = list.find(
        (item) =>
          item.name?.toLowerCase() === q ||
          item.shortName?.toLowerCase() === q ||
          item._id === name.trim(),
      );
      return found ? found._id : "";
    };

    const findIdsByPipe = (list, raw) => {
      if (!raw) return [];
      return raw
        .split(/[|;]/)
        .map((part) => findIdByName(list, part))
        .filter(Boolean);
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") return;
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
      if (lines.length < 2) {
        setError(
          "CSV file must contain a header row and at least one data row.",
        );
        return;
      }
      const parsedRows = lines.slice(1).map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const rawType = (cols[0] || "medicine").toLowerCase();
        const productType = rawType === "general" ? "general" : "medicine";
        return {
          id: Math.random().toString(36).substring(2, 9),
          productType,
          medicine:
            productType === "medicine"
              ? findIdByName(refs.medicines, cols[1])
              : "",
          productName:
            productType === "general" ? cols[2] || cols[1] || "" : "",
          company: findIdsByPipe(refs.companies, cols[3]),
          category: findIdByName(refs.categories, cols[4]),
          size: findIdsByPipe(refs.sizes, cols[5]),
          potency:
            productType === "medicine"
              ? findIdByName(refs.potencies, cols[6])
              : "",
          useTypes: findIdsByPipe(refs.useTypes, cols[7]),
          lowStockThreshold: cols[8] || "12",
        };
      });
      if (parsedRows.length > 0) {
        setRows(parsedRows);
        setError("");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const headers =
      "ProductType (medicine/general),MedicineName,GeneralProductName,Companies (pipe separated),Category,Sizes (pipe separated),Potency,UseTypes (pipe separated),LowStockThreshold\n";
    const sample =
      "medicine,Arnica Montana,,SBL,Dilution,30ml|100ml,30C,,12\n" +
      "general,,Arnica Hair Oil,SBL,Ointment,100ml,,,12\n";
    const blob = new Blob([headers + sample], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "product_bulk_import_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const validRows = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowNum = i + 1;
      const isRowEmpty =
        !r.medicine &&
        !r.productName.trim() &&
        r.company.length === 0 &&
        !r.category &&
        r.size.length === 0;

      if (isRowEmpty && rows.length > 1) continue;

      if (r.productType === "medicine" && !r.medicine) {
        setError(`Row #${rowNum}: Please select a Medicine / Remedy Name.`);
        return;
      }
      if (r.productType === "general" && !r.productName.trim()) {
        setError(`Row #${rowNum}: Please enter a Product Title.`);
        return;
      }
      if (r.company.length === 0) {
        setError(`Row #${rowNum}: Please select at least one Company / Brand.`);
        return;
      }
      if (!r.category) {
        setError(`Row #${rowNum}: Please select a Category.`);
        return;
      }
      if (r.size.length === 0) {
        setError(`Row #${rowNum}: Please select at least one Size.`);
        return;
      }

      validRows.push({
        ...r,
        companies: r.company,
        categories: r.category ? [r.category] : [],
        sizes: r.size,
        potencies: r.potency ? [r.potency] : [],
      });
    }

    if (validRows.length === 0) {
      setError("Please fill in at least one valid product row to import.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onImport(validRows);
    } catch (err) {
      setError(err?.message || "Failed to import products.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingRefs) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-green-700 animate-spin mr-3" />
        <span className="text-slate-800 text-base font-semibold">
          Loading catalog masters...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28">
      {/* Top Sticky Page Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Bulk Import Products
              </h1>
              <p className="text-xs text-slate-600">
                Register multiple Medicine or General products using searchable
                master dropdowns
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-sm font-semibold transition"
            >
              <Download className="w-4 h-4 text-slate-700" />
              Download CSV Template
            </button>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-semibold cursor-pointer transition">
              <Upload className="w-4 h-4" />
              Upload CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 text-sm font-semibold shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Importing..." : `Import ${rows.length} Products`}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick-Fill Common Defaults Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Common Product Defaults (Quick-Fill Bar)
              </h2>
              <span className="text-xs text-slate-600">
                — Set common attributes once and apply them to all rows
              </span>
            </div>
            <button
              type="button"
              onClick={applyDefaultsToAll}
              className="px-4 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-900 border border-green-300 text-xs font-bold transition"
            >
              Apply Defaults to All Rows
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Default Classification */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Type
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setDefaults({ ...defaults, productType: "medicine" })
                  }
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold border transition ${
                    defaults.productType === "medicine"
                      ? "border-green-600 bg-green-50 text-green-900"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Pill className="w-3.5 h-3.5 text-green-600" />
                  Medicine
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDefaults({
                      ...defaults,
                      productType: "general",
                      potency: "",
                    })
                  }
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-bold border transition ${
                    defaults.productType === "general"
                      ? "border-blue-600 bg-blue-50 text-blue-900"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                  Patents
                </button>
              </div>
            </div>

            {/* Default Company */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Company
              </label>
              <SearchableMultiSelect
                options={refs.companies}
                selected={defaults.company}
                onChange={(val) => setDefaults({ ...defaults, company: val })}
                placeholder="Select company(s)..."
              />
            </div>

            {/* Default Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Category
              </label>
              <SearchableSelect
                options={categoryOptions}
                value={defaults.category}
                onChange={(val) => setDefaults({ ...defaults, category: val })}
                placeholder="Select category..."
              />
            </div>

            {/* Default Potency */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Potency
              </label>
              <SearchableSelect
                options={potencyOptions}
                value={defaults.potency}
                onChange={(val) => setDefaults({ ...defaults, potency: val })}
                placeholder="Select Potency..."
                disabled={defaults.productType === "general"}
              />
            </div>

            {/* Default Size */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Size
              </label>
              <SearchableMultiSelect
                options={refs.sizes}
                selected={defaults.size}
                onChange={(val) => setDefaults({ ...defaults, size: val })}
                placeholder="Select size(s)..."
              />
            </div>

            {/* Default Use Types */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Default Use Types
              </label>
              <SearchableMultiSelect
                options={refs.useTypes}
                selected={defaults.useTypes}
                onChange={(val) => setDefaults({ ...defaults, useTypes: val })}
                placeholder="Select indications..."
              />
            </div>

            {/* Low Stock Alert */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Low Stock Alert
              </label>
              <input
                type="number"
                min="0"
                value={defaults.lowStockThreshold}
                onChange={(e) =>
                  setDefaults({
                    ...defaults,
                    lowStockThreshold: e.target.value,
                  })
                }
                placeholder="Alert Stock Threshold"
                title="Low Stock Alert Threshold"
                className="w-full px-2.5 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
              />
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="overflow-x-auto pb-48 -mb-48">
            <table className="w-full text-left border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-10 text-center">#</th>
                  <th className="py-3.5 px-3 w-40">Classification *</th>
                  <th className="py-3.5 px-3 w-64">
                    Medicine / Product Title *
                  </th>
                  <th className="py-3.5 px-3 w-56">Company / Brand *</th>
                  <th className="py-3.5 px-3 w-48">Category *</th>
                  {/* ★ Grouped Column */}
                  <th className="py-3.5 px-3 w-40">Potency</th>
                  <th className="py-3.5 px-3 w-52">Size / Volume *</th>
                  <th className="py-3.5 px-3 w-52">Use Types</th>
                  <th className="py-3.5 px-3 w-32">Low Stock Alert</th>
                  <th className="py-3.5 px-3 w-20 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, index) => {
                  const isMedicine = row.productType === "medicine";
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/70 transition align-top"
                    >
                      <td className="py-3.5 px-3 text-center text-xs font-bold text-slate-700 pt-5">
                        {index + 1}
                      </td>

                      {/* Product Type Toggle */}
                      <td className="py-3.5 px-3">
                        <div className="grid grid-cols-2 gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleRowChange(row.id, "productType", "medicine")
                            }
                            className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-bold border transition ${
                              isMedicine
                                ? "border-green-600 bg-green-50 text-green-900 shadow-xs"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Medicine
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRowChange(row.id, "productType", "general")
                            }
                            className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-bold border transition ${
                              !isMedicine
                                ? "border-blue-600 bg-blue-50 text-blue-900 shadow-xs"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            Patents
                          </button>
                        </div>
                      </td>

                      {/* Medicine Select OR General Product Title Input */}
                      <td className="py-3.5 px-3">
                        {isMedicine ? (
                          <SearchableSelect
                            options={medicineOptions}
                            value={row.medicine}
                            onChange={(val) =>
                              handleRowChange(row.id, "medicine", val)
                            }
                            placeholder="Search medicine..."
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.productName}
                            onChange={(e) =>
                              handleRowChange(
                                row.id,
                                "productName",
                                e.target.value,
                              )
                            }
                            placeholder="e.g., Arnica Hair Oil"
                            className="w-full px-2.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 outline-none"
                          />
                        )}
                      </td>

                      {/* Company Multi-Select */}
                      <td className="py-3.5 px-3">
                        <SearchableMultiSelect
                          options={refs.companies}
                          selected={row.company}
                          onChange={(val) =>
                            handleRowChange(row.id, "company", val)
                          }
                          placeholder="Select company(s)..."
                        />
                      </td>

                      {/* Category Single-Select */}
                      <td className="py-3.5 px-3">
                        <SearchableSelect
                          options={categoryOptions}
                          value={row.category}
                          onChange={(val) =>
                            handleRowChange(row.id, "category", val)
                          }
                          placeholder="Select category..."
                        />
                      </td>

                      {/* Potency Column */}
                      <td className="py-3.5 px-3">
                        <SearchableSelect
                          options={potencyOptions}
                          value={row.potency}
                          onChange={(val) =>
                            handleRowChange(row.id, "potency", val)
                          }
                          placeholder="Select potency..."
                          disabled={!isMedicine}
                        />
                      </td>

                      {/* Size Multi-Select */}
                      <td className="py-3.5 px-3">
                        <SearchableMultiSelect
                          options={refs.sizes}
                          selected={row.size}
                          onChange={(val) =>
                            handleRowChange(row.id, "size", val)
                          }
                          placeholder="Select size(s)..."
                        />
                      </td>

                      {/* Use Types Multi-Select */}
                      <td className="py-3.5 px-3">
                        <SearchableMultiSelect
                          options={refs.useTypes}
                          selected={row.useTypes}
                          onChange={(val) =>
                            handleRowChange(row.id, "useTypes", val)
                          }
                          placeholder="Select indications..."
                        />
                      </td>

                      {/* Low Stock Alert Column */}
                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          min="0"
                          value={row.lowStockThreshold}
                          onChange={(e) =>
                            handleRowChange(
                              row.id,
                              "lowStockThreshold",
                              e.target.value,
                            )
                          }
                          placeholder="12"
                          title="Low Stock Alert Threshold"
                          className="w-full px-2.5 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-600 outline-none"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateRow(index)}
                            title="Duplicate Row"
                            className="p-2 rounded-lg text-slate-700 hover:text-green-700 hover:bg-green-50 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length <= 1}
                            title="Delete Row"
                            className="p-2 rounded-lg text-slate-700 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Desktop Footer Controls */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => addRows(1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 text-sm font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4 text-green-700" />
                Add 1 Row
              </button>
              <button
                type="button"
                onClick={() => addRows(5)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 text-sm font-semibold shadow-xs transition"
              >
                <Plus className="w-4 h-4 text-green-700" />
                Add 5 Rows
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-sm font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 text-sm font-semibold shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting
                  ? "Importing..."
                  : `Save & Import (${rows.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE PRODUCT CARDS */}
        <div className="lg:hidden space-y-4">
          {rows.map((row, index) => {
            const isMedicine = row.productType === "medicine";
            return (
              <div
                key={row.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    Product #{index + 1}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateRow(index)}
                      className="p-2 rounded-lg bg-green-50 text-green-700"
                      title="Duplicate Row"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length <= 1}
                      className="p-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-30"
                      title="Delete Row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Classification Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Product Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleRowChange(row.id, "productType", "medicine")
                      }
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition ${
                        isMedicine
                          ? "border-green-600 bg-green-50 text-green-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <Pill className="w-4 h-4 text-green-600" />
                      Medicine
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleRowChange(row.id, "productType", "general")
                      }
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition ${
                        !isMedicine
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <FlaskConical className="w-4 h-4 text-blue-600" />
                      Patents
                    </button>
                  </div>
                </div>

                {/* Medicine OR Product Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {isMedicine
                      ? "Medicine / Remedy Name *"
                      : "Product Title *"}
                  </label>
                  {isMedicine ? (
                    <SearchableSelect
                      options={medicineOptions}
                      value={row.medicine}
                      onChange={(val) =>
                        handleRowChange(row.id, "medicine", val)
                      }
                      placeholder="Select a medicine from catalog..."
                    />
                  ) : (
                    <input
                      type="text"
                      value={row.productName}
                      onChange={(e) =>
                        handleRowChange(row.id, "productName", e.target.value)
                      }
                      placeholder="e.g., Arnica Hair Oil"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg placeholder:text-slate-400"
                    />
                  )}
                </div>

                {/* Company & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Company / Brand *
                    </label>
                    <SearchableMultiSelect
                      options={refs.companies}
                      selected={row.company}
                      onChange={(val) =>
                        handleRowChange(row.id, "company", val)
                      }
                      placeholder="Company..."
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category *
                    </label>
                    <SearchableSelect
                      options={categoryOptions}
                      value={row.category}
                      onChange={(val) =>
                        handleRowChange(row.id, "category", val)
                      }
                      placeholder="Category..."
                    />
                  </div>
                </div>

                {/* Size & Use Types */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Size *
                    </label>
                    <SearchableMultiSelect
                      options={refs.sizes}
                      selected={row.size}
                      onChange={(val) => handleRowChange(row.id, "size", val)}
                      placeholder="Select size..."
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Use Types
                    </label>
                    <SearchableMultiSelect
                      options={refs.useTypes}
                      selected={row.useTypes}
                      onChange={(val) =>
                        handleRowChange(row.id, "useTypes", val)
                      }
                      placeholder="Select use..."
                    />
                  </div>
                </div>

                {/* ★ Grouped Potency & Low Stock Alert in Mobile */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Potency
                    </label>
                    <SearchableSelect
                      options={potencyOptions}
                      value={row.potency}
                      onChange={(val) =>
                        handleRowChange(row.id, "potency", val)
                      }
                      placeholder="Select potency..."
                      disabled={!isMedicine}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={row.lowStockThreshold}
                      onChange={(e) =>
                        handleRowChange(
                          row.id,
                          "lowStockThreshold",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => addRows(1)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 text-green-700" />
              Add Row
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-green-700 text-white text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? "Importing..." : `Save & Import (${rows.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
