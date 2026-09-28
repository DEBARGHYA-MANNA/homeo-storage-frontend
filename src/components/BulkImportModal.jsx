"use client";

import { useState, useRef, useCallback } from "react";
import Modal from "@/components/Modal";
import { parseCSVFile, downloadTemplate } from "@/utils/csvParser";
import {
  Upload,
  FileSpreadsheet,
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
} from "lucide-react";
import toast from "react-hot-toast";

export default function BulkImportModal({
  isOpen,
  onClose,
  title = "Bulk Import",
  columns = [],
  // columns = [
  //   { key: "name", label: "Name", required: true, example: "SBL" },
  //   { key: "description", label: "Description", required: false, example: "Leading manufacturer" },
  // ]
  onImport,
  // onImport = async (rows) => { ... return { success: 5, failed: 1, errors: [...] } }
}) {
  const [activeTab, setActiveTab] = useState("csv"); // "csv" or "grid"
  const [step, setStep] = useState(1); // 1: Input, 2: Preview, 3: Results

  // CSV Upload State
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Grid State
  const [gridRows, setGridRows] = useState([createEmptyRow()]);

  // Import State
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  function createEmptyRow() {
    const row = {};
    columns.forEach((col) => {
      row[col.key] = "";
    });
    return row;
  }

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

        // Map CSV headers to column keys
        const mappedData = data.map((row) => {
          const mapped = {};
          columns.forEach((col) => {
            // Try exact match, then lowercase match
            const csvKey = Object.keys(row).find(
              (k) =>
                k.toLowerCase() === col.key.toLowerCase() ||
                k.toLowerCase() === col.label.toLowerCase().replace(/\s+/g, ""),
            );
            mapped[col.key] = csvKey ? row[csvKey]?.trim() || "" : "";
          });
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
    [columns],
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
  const addGridRow = () => {
    setGridRows([...gridRows, createEmptyRow()]);
  };

  const removeGridRow = (index) => {
    if (gridRows.length <= 1) return;
    setGridRows(gridRows.filter((_, i) => i !== index));
  };

  const updateGridCell = (rowIndex, key, value) => {
    const updated = [...gridRows];
    updated[rowIndex][key] = value;
    setGridRows(updated);
  };

  // Handle paste from Excel
  const handlePaste = (e, rowIndex, colKey) => {
    const pasteData = e.clipboardData.getData("text");
    const lines = pasteData.split("\n").filter((line) => line.trim());

    if (lines.length > 1) {
      // Multi-line paste (from Excel)
      e.preventDefault();
      const colIndex = columns.findIndex((c) => c.key === colKey);
      const newRows = [...gridRows];

      lines.forEach((line, lineIdx) => {
        const cells = line.split("\t"); // Excel uses tabs
        const targetRowIdx = rowIndex + lineIdx;

        if (targetRowIdx < newRows.length) {
          cells.forEach((cell, cellIdx) => {
            const targetCol = columns[colIndex + cellIdx];
            if (targetCol) {
              newRows[targetRowIdx][targetCol.key] = cell.trim();
            }
          });
        } else {
          const newRow = createEmptyRow();
          cells.forEach((cell, cellIdx) => {
            const targetCol = columns[colIndex + cellIdx];
            if (targetCol) {
              newRow[targetCol.key] = cell.trim();
            }
          });
          newRows.push(newRow);
        }
      });

      setGridRows(newRows);
      toast.success(`${lines.length} rows pasted from clipboard`);
    }
  };

  const previewGridData = () => {
    // Filter out completely empty rows
    const validRows = gridRows.filter((row) =>
      columns.some((col) => row[col.key]?.trim()),
    );

    if (validRows.length === 0) {
      toast.error("Please fill in at least one row");
      return;
    }

    setCsvData(validRows);
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
      columns.forEach((col) => {
        if (col.required && !row[col.key]?.trim()) {
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
    setGridRows([createEmptyRow()]);
    setStep(1);
    setResults(null);
    setActiveTab("csv");
    onClose();
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      title={title}
      size="xl"
      footer={
        step === 2 ? (
          <>
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm
                         font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              ← Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white
                         rounded-lg text-sm font-medium hover:bg-green-800
                         transition disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {importing ? "Importing..." : `Import ${csvData.length} Items`}
            </button>
          </>
        ) : step === 3 ? (
          <button
            onClick={resetModal}
            className="px-5 py-2.5 bg-green-700 text-white rounded-lg
                       text-sm font-medium hover:bg-green-800 transition"
          >
            Done
          </button>
        ) : null
      }
    >
      {/* ============================================ */}
      {/* STEP 1: INPUT                                */}
      {/* ============================================ */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex gap-2 border-b pb-2">
            <button
              onClick={() => setActiveTab("csv")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  activeTab === "csv"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <FileText className="w-4 h-4" />
              Upload CSV File
            </button>
            <button
              onClick={() => setActiveTab("grid")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
                ${
                  activeTab === "grid"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              <Table className="w-4 h-4" />
              Excel-Style Grid
            </button>
          </div>

          {/* CSV Upload Tab */}
          {activeTab === "csv" && (
            <div className="space-y-4">
              {/* Download Template */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Download className="w-4 h-4" />
                  <span>Download CSV template with correct headers</span>
                </div>
                <button
                  onClick={() =>
                    downloadTemplate(
                      columns,
                      title.replace(/\s+/g, "_").toLowerCase(),
                    )
                  }
                  className="text-sm font-medium text-blue-700 hover:text-blue-900
                             bg-white px-3 py-1.5 rounded border border-blue-200 transition"
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
                className={`
                  border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
                  transition-all duration-200
                  ${
                    dragActive
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                  }
                `}
              >
                <Upload
                  className={`w-10 h-10 mx-auto mb-3 ${
                    dragActive ? "text-green-600" : "text-gray-400"
                  }`}
                />
                <p className="text-sm font-medium text-gray-700">
                  Drag & drop your CSV file here
                </p>
                <p className="text-xs text-gray-400 mt-1">
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

          {/* Grid Tab */}
          {activeTab === "grid" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  💡 Tip: You can paste directly from Excel (Ctrl+V)
                </p>
                <button
                  onClick={addGridRow}
                  className="flex items-center gap-1 text-sm text-green-700
                             hover:bg-green-50 px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Row
                </button>
              </div>

              {/* Editable Grid */}
              <div className="border rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr>
                      <th className="px-2 py-2 text-xs text-gray-400 w-10">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-2 py-2 text-xs font-semibold text-gray-600
                                     text-left whitespace-nowrap"
                        >
                          {col.label}
                          {col.required && (
                            <span className="text-red-500 ml-0.5">*</span>
                          )}
                        </th>
                      ))}
                      <th className="px-2 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {gridRows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        <td className="px-2 py-1 text-xs text-gray-400 text-center">
                          {rowIdx + 1}
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-1 py-1">
                            <input
                              type={col.type || "text"}
                              value={row[col.key]}
                              onChange={(e) =>
                                updateGridCell(rowIdx, col.key, e.target.value)
                              }
                              onPaste={(e) => handlePaste(e, rowIdx, col.key)}
                              placeholder={col.example || col.label}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded
                                         text-sm focus:outline-none focus:ring-1
                                         focus:ring-green-500 min-w-[100px]"
                            />
                          </td>
                        ))}
                        <td className="px-1 py-1">
                          <button
                            onClick={() => removeGridRow(rowIdx)}
                            className="p-1 text-red-400 hover:text-red-600 rounded"
                            disabled={gridRows.length <= 1}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                onClick={previewGridData}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700
                           border border-green-200 rounded-lg text-sm font-medium
                           hover:bg-green-100 transition w-full justify-center"
              >
                Preview{" "}
                {
                  gridRows.filter((r) => columns.some((c) => r[c.key]?.trim()))
                    .length
                }{" "}
                Rows
                <ArrowRight className="w-4 h-4" />
              </button>
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
            <h3 className="text-sm font-semibold text-gray-700">
              Preview: {csvData.length} rows ready to import
              {fileName && (
                <span className="text-gray-400 font-normal ml-2">
                  ({fileName})
                </span>
              )}
            </h3>
          </div>

          <div className="border rounded-lg overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="px-3 py-2 text-xs text-gray-400 w-10">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-3 py-2 text-xs font-semibold text-gray-600 text-left"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {csvData.map((row, idx) => {
                  const hasErrors = columns.some(
                    (col) => col.required && !row[col.key]?.trim(),
                  );
                  return (
                    <tr
                      key={idx}
                      className={hasErrors ? "bg-red-50" : "hover:bg-gray-50"}
                    >
                      <td className="px-3 py-2 text-xs text-gray-400">
                        {hasErrors ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          idx + 1
                        )}
                      </td>
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-3 py-2 ${
                            col.required && !row[col.key]?.trim()
                              ? "text-red-600 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {row[col.key] || (
                            <span className="text-red-400 italic text-xs">
                              Missing
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STEP 3: RESULTS                              */}
      {/* ============================================ */}
      {step === 3 && results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">
                {results.totalAttempted}
              </p>
              <p className="text-xs text-gray-500">Attempted</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">
                {results.success || 0}
              </p>
              <p className="text-xs text-green-600">Imported</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">
                {(results.failed || 0) +
                  (results.validationErrors?.length || 0)}
              </p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
          </div>

          {/* Error Details */}
          {results.errors?.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Import Errors
              </h4>
              <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {results.validationErrors?.length > 0 && (
            <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
              <h4 className="text-sm font-semibold text-yellow-700 mb-2">
                Validation Errors (Skipped)
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1 max-h-40 overflow-y-auto">
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
    </Modal>
  );
}
