"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { parseCSVFile, downloadTemplate } from "@/utils/csvParser";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  Table,
  FileText,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Check,
  WandSparkles,
} from "lucide-react";
import toast from "react-hot-toast";

// ============================================
// ★ BUILT-IN FIELD PRESETS (from SizeForm & PotencyForm)
// Automatically upgrades columns by matching `col.key`
// ============================================
const FIELD_PRESETS = {
  unit: {
    type: "select",
    default: "ml",
    options: [
      { value: "ml", label: "ml (Milliliters)" },
      { value: "g", label: "g (Grams)" },
      { value: "l", label: "l (Liters)" },
      { value: "kg", label: "kg (Kilograms)" },
      { value: "pieces", label: "pieces (Pcs)" },
    ],
  },
  scale: {
    type: "select",
    default: "CH",
    options: [
      { value: "CH", label: "CH (Centesimal)" },
      { value: "C", label: "C (Centesimal)" },
      { value: "X", label: "X / D (Decimal)" },
      { value: "LM", label: "LM (50 Millesimal)" },
      { value: "Q", label: "Q (Mother Tincture)" },
      { value: "M", label: "M (Thousand Centesimal)" },
    ],
  },
  volume: {
    type: "number",
    example: "e.g., 30, 100, 450",
  },
  level: {
    type: "number",
    example: "e.g., 30, 200, 1000",
  },
  isActive: {
    type: "checkbox",
    default: true,
  },
};

// ============================================
// ★ CUSTOM DROPDOWN COMPONENT FOR GRID CELLS
// ============================================
function GridSelectDropdown({
  value,
  options = [],
  onChange,
  placeholder = "Select...",
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full min-w-[160px]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 transition"
      >
        <span
          className={`truncate ${
            selectedOption ? "text-slate-900" : "text-slate-400 font-normal"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute left-0 z-50 mt-1 w-full min-w-[200px] bg-white border border-slate-300 rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-xs transition ${
                    isSelected
                      ? "bg-green-50 text-green-950 font-bold"
                      : "bg-white text-slate-900 font-medium hover:bg-slate-100"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-green-700 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BulkImportModal({
  isOpen,
  onClose,
  title = "Bulk Import",
  columns = [],
  onImport,
}) {
  // ★ Enhance columns automatically with FIELD_PRESETS (unit, scale, volume, level, isActive)
  const enhancedColumns = useMemo(
    () =>
      columns.map((col) => {
        const preset = FIELD_PRESETS[col.key] || {};
        return {
          ...preset,
          ...col,
          type: col.type || preset.type || "text",
          options: col.options || preset.options || undefined,
          default: col.default !== undefined ? col.default : preset.default,
          example: col.example || preset.example || col.label,
        };
      }),
    [columns],
  );

  const hasSizeAutoFill = useMemo(
    () =>
      enhancedColumns.some((c) => c.key === "volume") &&
      enhancedColumns.some((c) => c.key === "unit") &&
      enhancedColumns.some((c) => c.key === "name"),
    [enhancedColumns],
  );

  const hasPotencyAutoFill = useMemo(
  () =>
    enhancedColumns.some((c) => c.key === "scale") &&
    enhancedColumns.some((c) => c.key === "level") &&
    enhancedColumns.some((c) => c.key === "name"),
  [enhancedColumns],
);

  const createEmptyRow = useCallback(() => {
    const row = {};
    enhancedColumns.forEach((col) => {
      if (col.type === "checkbox") {
        row[col.key] = col.default ?? true;
      } else {
        row[col.key] = col.default ?? "";
      }
    });
    return row;
  }, [enhancedColumns]);

  const [activeTab, setActiveTab] = useState("grid"); // Default to grid for quick entry
  const [step, setStep] = useState(1); // 1: Input, 2: Preview, 3: Results

  // CSV Upload State
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Grid State
  const [gridRows, setGridRows] = useState(() => [
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
  ]);

  // Re-initialize rows when modal opens or columns change
  useEffect(() => {
    if (isOpen) {
      setGridRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    }
  }, [isOpen, createEmptyRow]);

  // Import State
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  // ============================================
  // Normalize raw values (CSV / Paste -> select value / bool)
  // ============================================
  const normalizeCellValue = useCallback((col, rawValue) => {
    if (col.type === "checkbox") {
      const v = String(rawValue ?? "")
        .trim()
        .toLowerCase();
      if (v === "") return col.default ?? true;
      return ["true", "yes", "1", "active", "y"].includes(v);
    }
    if (col.type === "select" && col.options?.length) {
      const v = String(rawValue ?? "")
        .trim()
        .toLowerCase();
      if (!v) return col.default ?? "";
      const match = col.options.find(
        (o) =>
          String(o.value).toLowerCase() === v ||
          String(o.label).toLowerCase() === v ||
          String(o.label).toLowerCase().startsWith(v),
      );
      return match ? match.value : (col.default ?? "");
    }
    return rawValue ?? "";
  }, []);

  const renderCellDisplay = (col, value) => {
    if (col.type === "checkbox") return value ? "Active" : "Inactive";
    if (col.type === "select" && col.options?.length) {
      const opt = col.options.find((o) => o.value === value);
      return opt ? opt.label : value;
    }
    return value;
  };

  // ============================================
  // CSV FILE HANDLING
  // ============================================
  const handleFile = useCallback(
    async (file) => {
      if (!file) return;

      if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
        toast.error("Please upload a .csv file");
        return;
      }

      try {
        const data = await parseCSVFile(file);

        if (data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        const mappedData = data.map((row) => {
          const mapped = {};
          enhancedColumns.forEach((col) => {
            const csvKey = Object.keys(row).find(
              (k) =>
                k.toLowerCase() === col.key.toLowerCase() ||
                k.toLowerCase() === col.label.toLowerCase().replace(/\s+/g, ""),
            );
            const rawValue = csvKey ? row[csvKey]?.trim() || "" : "";
            mapped[col.key] = normalizeCellValue(col, rawValue);
          });

          // Auto-fill Size name if missing in CSV
          if (hasSizeAutoFill && !mapped.name && mapped.volume && mapped.unit) {
            mapped.name = `${mapped.volume} ${mapped.unit}`;
          }
          return mapped;
        });

        setCsvData(mappedData);
        setFileName(file.name);
        setStep(2);
        toast.success(`${mappedData.length} rows parsed from CSV`);
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    },
    [enhancedColumns, normalizeCellValue, hasSizeAutoFill],
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  // ============================================
  // GRID HANDLING
  // ============================================
  const addGridRows = (count = 1) => {
    const newRows = Array.from({ length: count }, () => createEmptyRow());
    setGridRows((prev) => [...prev, ...newRows]);
  };

  const duplicateGridRow = (index) => {
    const cloned = { ...gridRows[index] };
    const updated = [...gridRows];
    updated.splice(index + 1, 0, cloned);
    setGridRows(updated);
  };

  const removeGridRow = (index) => {
    if (gridRows.length <= 1) return;
    setGridRows(gridRows.filter((_, i) => i !== index));
  };

  const updateGridCell = (rowIndex, key, value) => {
    setGridRows((prev) => {
      const updated = [...prev];
      const currentRow = { ...updated[rowIndex], [key]: value };

      // ★ Just like SizeForm: Auto-generate display name when volume or unit changes
      if (hasSizeAutoFill && (key === "volume" || key === "unit")) {
        const vol = key === "volume" ? value : currentRow.volume;
        const un = key === "unit" ? value : currentRow.unit;
        if (vol && un) {
          currentRow.name = `${vol} ${un}`;
        }
      }

      // Auto-generate Potency display name
      if (hasPotencyAutoFill && (key === "scale" || key === "level")) {
        const level = key === "level" ? value : currentRow.level;
        const scale = key === "scale" ? value : currentRow.scale;

        if (level && scale) {
          currentRow.name = `${level} ${scale}`;
        }
      }

      updated[rowIndex] = currentRow;
      return updated;
    });
  };

  // Handle paste from Excel
  const handlePaste = (e, rowIndex, colKey) => {
    const col = enhancedColumns.find((c) => c.key === colKey);
    if (col?.type === "select" || col?.type === "checkbox") return;

    const pasteData = e.clipboardData.getData("text");
    const lines = pasteData.split("\n").filter((line) => line.trim());

    if (lines.length > 1) {
      e.preventDefault();
      const colIndex = enhancedColumns.findIndex((c) => c.key === colKey);
      const newRows = [...gridRows];

      lines.forEach((line, lineIdx) => {
        const cells = line.split("\t");
        const targetRowIdx = rowIndex + lineIdx;

        const applyCells = (targetRow) => {
          cells.forEach((cell, cellIdx) => {
            const targetCol = enhancedColumns[colIndex + cellIdx];
            if (targetCol) {
              targetRow[targetCol.key] = normalizeCellValue(
                targetCol,
                cell.trim(),
              );
            }
          });
          if (
            hasSizeAutoFill &&
            !targetRow.name &&
            targetRow.volume &&
            targetRow.unit
          ) {
            targetRow.name = `${targetRow.volume} ${targetRow.unit}`;
          }
        };

        if (targetRowIdx < newRows.length) {
          applyCells(newRows[targetRowIdx]);
        } else {
          const newRow = createEmptyRow();
          applyCells(newRow);
          newRows.push(newRow);
        }
      });

      setGridRows(newRows);
      toast.success(`${lines.length} rows pasted from clipboard`);
    }
  };

  // A row counts as filled if at least one non-default / text / number field is entered
  const isRowFilled = (row) =>
    enhancedColumns.some((col) => {
      if (col.type === "checkbox") return false;
      if (col.type === "select" && row[col.key] === col.default) return false;
      return String(row[col.key] ?? "").trim() !== "";
    });

  const previewGridData = () => {
    const validRows = gridRows.filter(isRowFilled);

    if (validRows.length === 0) {
      toast.error("Please fill in at least one row");
      return;
    }

    setCsvData(validRows);
    setFileName("");
    setStep(2);
  };

  // ============================================
  // VALIDATION
  // ============================================
  const validateRows = (rows) => {
    const valid = [];
    const invalid = [];

    rows.forEach((row, index) => {
      const errors = [];
      enhancedColumns.forEach((col) => {
        if (col.type === "checkbox") return;
        if (col.required && !String(row[col.key] ?? "").trim()) {
          errors.push(`${col.label} is required`);
        }
      });

      if (errors.length > 0) {
        invalid.push({ row: index + 1, data: row, errors });
      } else {
        valid.push(row);
      }
    });

    return { valid, invalid };
  };

  // ============================================
  // IMPORT
  // ============================================
  const handleImport = async () => {
    const { valid, invalid } = validateRows(csvData);

    if (valid.length === 0) {
      toast.error("No valid rows to import. Please check required fields.");
      return;
    }

    try {
      setImporting(true);
      const result = await onImport(valid);
      setResults({
        ...result,
        validationErrors: invalid,
        totalAttempted: csvData.length,
      });
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  // ============================================
  // RESET
  // ============================================
  const resetModal = () => {
    setCsvData([]);
    setFileName("");
    setGridRows([createEmptyRow(), createEmptyRow(), createEmptyRow()]);
    setStep(1);
    setResults(null);
    setActiveTab("grid");
    onClose();
  };

  if (!isOpen) return null;

  // ============================================
  // ★ RENDER CELL INPUT (Custom Select / Checkbox / Number / Text)
  // ============================================
  const renderGridCellInput = (col, row, rowIdx) => {
    if (col.type === "select") {
      return (
        <GridSelectDropdown
          value={row[col.key] ?? ""}
          options={col.options || []}
          onChange={(val) => updateGridCell(rowIdx, col.key, val)}
          placeholder={`Select ${col.label}...`}
        />
      );
    }

    if (col.type === "checkbox") {
      return (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none px-2 py-1.5">
          <input
            type="checkbox"
            checked={!!row[col.key]}
            onChange={(e) => updateGridCell(rowIdx, col.key, e.target.checked)}
            className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500 cursor-pointer"
          />
          <span className="text-xs font-semibold text-slate-800">
            {row[col.key] ? "Active" : "Inactive"}
          </span>
        </label>
      );
    }

    return (
      <input
        type={col.type || "text"}
        value={row[col.key] ?? ""}
        onChange={(e) => updateGridCell(rowIdx, col.key, e.target.value)}
        onPaste={(e) => handlePaste(e, rowIdx, col.key)}
        placeholder={col.example || col.label}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 min-w-[130px]"
      />
    );
  };

  // ============================================
  // RENDER — FULL SCREEN
  // ============================================
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="min-h-screen flex flex-col text-slate-900">
        {/* ============================================ */}
        {/* STICKY FULL-SCREEN HEADER                    */}
        {/* ============================================ */}
        <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
          <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={resetModal}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 font-semibold text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                <p className="text-xs text-slate-600">
                  Enter records using the interactive grid or upload a CSV file
                </p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 text-xs font-bold">
              {["Input", "Preview", "Results"].map((label, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isDone = step > stepNum;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition ${
                        isActive
                          ? "bg-green-700 text-white border-green-700"
                          : isDone
                            ? "bg-green-50 text-green-800 border-green-300"
                            : "bg-white text-slate-500 border-slate-300"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                          isActive
                            ? "bg-white text-green-800"
                            : isDone
                              ? "bg-green-600 text-white"
                              : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          stepNum
                        )}
                      </span>
                      {label}
                    </div>
                    {idx < 2 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* MAIN CONTENT                                 */}
        {/* ============================================ */}
        <div className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 py-6 pb-28">
          {/* ============================================ */}
          {/* STEP 1: INPUT                                */}
          {/* ============================================ */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Tab Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("grid")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === "grid"
                        ? "bg-green-700 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <Table className="w-4 h-4" />
                    Excel-Style Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("csv")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      activeTab === "csv"
                        ? "bg-green-700 text-white shadow-sm"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Upload CSV File
                  </button>
                </div>

                {activeTab === "grid" && (
                  <p className="text-xs font-medium text-slate-600 flex">
                    <WandSparkles className="w-4 h-4" /> Tip: You can paste multiple rows directly from Excel
                    (Ctrl+V)
                    {hasSizeAutoFill &&
                      " • Display Name auto-fills from Volume + Unit"}
                    {hasPotencyAutoFill &&
                      " • Potency auto-fills from Scale + Level"}
                  </p>
                )}
              </div>

              {/* ============================================ */}
              {/* GRID TAB                                     */}
              {/* ============================================ */}
              {activeTab === "grid" && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                  {/* Extra bottom padding so open dropdowns in last rows are never clipped */}
                  <div className="overflow-x-auto pb-48 -mb-48">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-900 text-xs font-bold uppercase tracking-wider">
                          <th className="px-3 py-3.5 w-12 text-center">#</th>
                          {enhancedColumns.map((col) => (
                            <th
                              key={col.key}
                              className="px-3 py-3.5 text-left whitespace-nowrap"
                            >
                              {col.label}
                              {col.required && (
                                <span className="text-red-600 ml-1">*</span>
                              )}
                            </th>
                          ))}
                          <th className="px-3 py-3.5 w-24 text-center">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {gridRows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-slate-50/80 transition align-top"
                          >
                            <td className="px-3 py-3.5 text-xs font-bold text-slate-600 text-center">
                              {rowIdx + 1}
                            </td>
                            {enhancedColumns.map((col) => (
                              <td key={col.key} className="px-2.5 py-2.5">
                                {renderGridCellInput(col, row, rowIdx)}
                              </td>
                            ))}
                            <td className="px-2.5 py-2.5 text-center">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => duplicateGridRow(rowIdx)}
                                  title="Duplicate Row"
                                  className="p-2 text-slate-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeGridRow(rowIdx)}
                                  className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                                  disabled={gridRows.length <= 1}
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Grid Footer Controls */}
                  <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 rounded-b-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => addGridRows(1)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 text-sm font-semibold shadow-xs transition"
                      >
                        <Plus className="w-4 h-4 text-green-700" />
                        Add 1 Row
                      </button>
                      <button
                        type="button"
                        onClick={() => addGridRows(5)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 hover:bg-slate-100 text-sm font-semibold shadow-xs transition"
                      >
                        <Plus className="w-4 h-4 text-green-700" />
                        Add 5 Rows
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={resetModal}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-sm font-semibold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={previewGridData}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition shadow-sm"
                      >
                        Preview {gridRows.filter(isRowFilled).length} Rows
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================ */}
              {/* CSV UPLOAD TAB                               */}
              {/* ============================================ */}
              {activeTab === "csv" && (
                <div className="space-y-4">
                  {/* Download Template */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <Download className="w-4 h-4 text-blue-700" />
                      <span>
                        Download CSV template with the exact column headers
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        downloadTemplate(
                          enhancedColumns,
                          title.replace(/\s+/g, "_").toLowerCase(),
                        )
                      }
                      className="text-sm font-semibold text-blue-800 hover:text-blue-950 bg-white px-4 py-2 rounded-lg border border-blue-300 transition shrink-0"
                    >
                      Download Template
                    </button>
                  </div>

                  {/* Drag & Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`bg-white border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200 shadow-sm ${
                      dragActive
                        ? "border-green-500 bg-green-50"
                        : "border-slate-300 hover:border-green-500 hover:bg-green-50/40"
                    }`}
                  >
                    <Upload
                      className={`w-12 h-12 mx-auto mb-3 ${
                        dragActive ? "text-green-600" : "text-slate-400"
                      }`}
                    />
                    <p className="text-base font-semibold text-slate-800">
                      Drag & drop your CSV file here
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      or click to browse files (.csv)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 2: PREVIEW                              */}
          {/* ============================================ */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  Preview: {csvData.length} rows ready to import
                  {fileName && (
                    <span className="text-slate-500 font-medium ml-2 text-sm">
                      ({fileName})
                    </span>
                  )}
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-100 z-10">
                      <tr className="border-b border-slate-200">
                        <th className="px-3 py-3 text-xs font-bold text-slate-600 w-12 text-center">
                          #
                        </th>
                        {enhancedColumns.map((col) => (
                          <th
                            key={col.key}
                            className="px-3 py-3 text-xs font-bold text-slate-900 text-left uppercase tracking-wide whitespace-nowrap"
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {csvData.map((row, idx) => {
                        const hasErrors = enhancedColumns.some(
                          (col) =>
                            col.type !== "checkbox" &&
                            col.required &&
                            !String(row[col.key] ?? "").trim(),
                        );
                        return (
                          <tr
                            key={idx}
                            className={
                              hasErrors ? "bg-red-50" : "hover:bg-slate-50"
                            }
                          >
                            <td className="px-3 py-2.5 text-xs font-bold text-slate-600 text-center">
                              {hasErrors ? (
                                <XCircle className="w-4 h-4 text-red-600 mx-auto" />
                              ) : (
                                idx + 1
                              )}
                            </td>
                            {enhancedColumns.map((col) => {
                              const isMissing =
                                col.type !== "checkbox" &&
                                col.required &&
                                !String(row[col.key] ?? "").trim();
                              return (
                                <td
                                  key={col.key}
                                  className={`px-3 py-2.5 font-semibold ${
                                    isMissing
                                      ? "text-red-600"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {col.type === "checkbox" ||
                                  String(row[col.key] ?? "").trim() ? (
                                    renderCellDisplay(col, row[col.key])
                                  ) : (
                                    <span className="text-red-500 italic text-xs font-semibold">
                                      Missing
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* STEP 3: RESULTS                              */}
          {/* ============================================ */}
          {step === 3 && results && (
            <div className="space-y-5 max-w-3xl mx-auto">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
                  <p className="text-3xl font-bold text-slate-900">
                    {results.totalAttempted}
                  </p>
                  <p className="text-xs font-bold text-slate-600 mt-1 uppercase tracking-wide">
                    Attempted
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center shadow-sm">
                  <CheckCircle2 className="w-7 h-7 text-green-600 mx-auto mb-1" />
                  <p className="text-3xl font-bold text-green-800">
                    {results.success || 0}
                  </p>
                  <p className="text-xs font-bold text-green-700 mt-1 uppercase tracking-wide">
                    Imported
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center shadow-sm">
                  <XCircle className="w-7 h-7 text-red-600 mx-auto mb-1" />
                  <p className="text-3xl font-bold text-red-800">
                    {(results.failed || 0) +
                      (results.validationErrors?.length || 0)}
                  </p>
                  <p className="text-xs font-bold text-red-700 mt-1 uppercase tracking-wide">
                    Failed
                  </p>
                </div>
              </div>

              {results.errors?.length > 0 && (
                <div className="border border-red-200 rounded-2xl p-5 bg-red-50">
                  <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Import Errors
                  </h4>
                  <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto font-medium">
                    {results.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.validationErrors?.length > 0 && (
                <div className="border border-yellow-200 rounded-2xl p-5 bg-yellow-50">
                  <h4 className="text-sm font-bold text-yellow-800 mb-2">
                    Validation Errors (Skipped)
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1 max-h-48 overflow-y-auto font-medium">
                    {results.validationErrors.map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.errors.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ============================================ */}
        {/* STICKY FOOTER ACTION BAR                     */}
        {/* ============================================ */}
        {(step === 2 || step === 3) && (
          <div className="sticky bottom-0 z-30 bg-white border-t border-slate-200 px-4 sm:px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="max-w-[1400px] mx-auto flex items-center justify-end gap-3">
              {step === 2 && (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={importing}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50 shadow-sm"
                  >
                    {importing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {importing
                      ? "Importing..."
                      : `Import ${csvData.length} Items`}
                  </button>
                </>
              )}
              {step === 3 && (
                <button
                  type="button"
                  onClick={resetModal}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold hover:bg-green-800 transition shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
