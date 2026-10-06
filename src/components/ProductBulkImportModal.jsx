"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { GridSelectCell, GridMultiSelectCell } from "@/components/GridSelectCell";
import referenceService from "@/services/referenceService";
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Copy,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";

const createEmptyRow = () => ({
  productType: "medicine", // "medicine" or "general"
  productName: "",
  medicine: "",
  company: "",
  category: "",
  size: "",
  potency: "",
  useTypes: [],
  lowStockThreshold: "10",
  hsnCode: "3004",
});

export default function ProductBulkImportModal({
  isOpen,
  onClose,
  onImport,
}) {
  const [step, setStep] = useState(1); // 1: Grid, 2: Preview, 3: Results
  const [gridRows, setGridRows] = useState([createEmptyRow()]);

  const [refs, setRefs] = useState({
    medicines: [],
    companies: [],
    categories: [],
    sizes: [],
    potencies: [],
    useTypes: [],
  });
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

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
        setRefs({ medicines, companies, categories, sizes, potencies, useTypes });
      } catch (error) {
        toast.error("Failed to load master lookup options");
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, [isOpen]);

  const addRow = () => {
    setGridRows([...gridRows, createEmptyRow()]);
  };

  const removeRow = (index) => {
    if (gridRows.length <= 1) return;
    setGridRows(gridRows.filter((_, i) => i !== index));
  };

  const updateCell = (rowIndex, key, value) => {
    const updated = [...gridRows];
    updated[rowIndex][key] = value;

    if (key === "productType") {
      if (value === "general") {
        updated[rowIndex].medicine = "";
        updated[rowIndex].potency = "";
      } else {
        updated[rowIndex].productName = "";
      }
    }

    setGridRows(updated);
  };

  const duplicateRow = (index) => {
    const rowToCopy = { ...gridRows[index], useTypes: [...gridRows[index].useTypes] };
    const updated = [...gridRows];
    updated.splice(index + 1, 0, rowToCopy);
    setGridRows(updated);
    toast.success("Row duplicated");
  };

  const validateRows = (rows) => {
    const valid = [];
    const invalid = [];

    rows.forEach((row, index) => {
      const errors = [];
      const isMed = row.productType === "medicine";

      if (isMed && !row.medicine) errors.push("Medicine Selection is required");
      if (!isMed && !row.productName?.trim()) errors.push("Product Name is required");
      if (!row.company) errors.push("Company is required");
      if (!row.category) errors.push("Category is required");
      if (!row.size) errors.push("Size selection is required");

      if (errors.length > 0) {
        invalid.push({ row: index + 1, errors });
      } else {
        valid.push(row);
      }
    });

    return { valid, invalid };
  };

  const goToPreview = () => {
    const nonEmptyRows = gridRows.filter(
      (r) => r.productName || r.medicine || r.company
    );

    if (nonEmptyRows.length === 0) {
      toast.error("Please fill in at least one row with name/medicine details");
      return;
    }

    setStep(2);
  };

  const handleImport = async () => {
    const nonEmptyRows = gridRows.filter(
      (r) => r.productName || r.medicine || r.company
    );
    const { valid, invalid } = validateRows(nonEmptyRows);

    if (valid.length === 0) {
      toast.error("No valid entries to register");
      return;
    }

    try {
      setImporting(true);
      const result = await onImport(valid);
      setResults({
        ...result,
        validationErrors: invalid,
        totalAttempted: nonEmptyRows.length,
      });
      setStep(3);
    } catch (error) {
      toast.error("Process failed");
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setGridRows([createEmptyRow()]);
    setStep(1);
    setResults(null);
    onClose();
  };

  const getRowDisplayName = (row) => {
    if (row.productType === "medicine") {
      const med = refs.medicines.find((m) => m._id === row.medicine);
      return med ? med.name : "❌ No remedy selected";
    }
    return row.productName || "❌ No name configured";
  };

  const getRefName = (list, id) => {
    const item = list.find((i) => i._id === id);
    return item?.name || "-";
  };

  const toOptions = (list) => list.map((item) => ({ value: item._id, label: item.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetModal}
      title="Bulk Product Catalogue Registration"
      size="full"
      footer={
        step === 1 ? (
          <>
            <button
              onClick={resetModal}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={goToPreview}
              disabled={loadingRefs}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition disabled:opacity-50"
            >
              Preview Registrations <ArrowRight className="w-4 h-4" />
            </button>
          </>
        ) : step === 2 ? (
          <>
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ← Edit Rows
            </button>
            <button
              onClick={handleImport}
              disabled={importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? "Processing..." : `Register ${gridRows.filter((r) => r.productName || r.medicine || r.company).length} Products`}
            </button>
          </>
        ) : (
          <button
            onClick={resetModal}
            className="px-5 py-2.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800"
          >
            Complete
          </button>
        )
      }
    >
      {loadingRefs && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-green-600 animate-spin mr-2" />
          <span className="text-gray-500">Retrieving master details...</span>
        </div>
      )}

      {!loadingRefs && step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              💡 Register your items first. After registration, search for them in the **Stock Manager** to assign batch codes, purchase prices, and initial stock quantities.
            </p>
            <button
              onClick={addRow}
              className="flex items-center gap-1 bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>

          <div className="border rounded-lg overflow-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="px-2 py-2 text-gray-500 w-8">#</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Type *</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Medicine / Product Name *</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Company *</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Category *</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Size *</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Potency</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Use Types</th>
                  <th className="px-2 py-2 text-gray-600 text-left">Min. Alert</th>
                  <th className="px-2 py-2 text-gray-600 text-left">HSN</th>
                  <th className="px-2 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gridRows.map((row, rowIdx) => {
                  const isMed = row.productType === "medicine";
                  return (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      <td className="px-2 py-1 text-gray-400 text-center">{rowIdx + 1}</td>

                      <td className="px-1 py-1">
                        <select
                          value={row.productType}
                          onChange={(e) => updateCell(rowIdx, "productType", e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs bg-white"
                        >
                          <option value="medicine">💊 Medicine</option>
                          <option value="general">🧴 General</option>
                        </select>
                      </td>

                      <td className="px-1 py-1">
                        {isMed ? (
                          <GridSelectCell
                            value={row.medicine}
                            onChange={(v) => updateCell(rowIdx, "medicine", v)}
                            options={toOptions(refs.medicines)}
                            placeholder="Find medicine"
                          />
                        ) : (
                          <input
                            type="text"
                            value={row.productName}
                            onChange={(e) => updateCell(rowIdx, "productName", e.target.value)}
                            placeholder="e.g. Skin Cream"
                            className="w-full min-w-[140px] px-2 py-1.5 border border-gray-200 rounded text-xs"
                          />
                        )}
                      </td>

                      <td className="px-1 py-1">
                        <GridSelectCell
                          value={row.company}
                          onChange={(v) => updateCell(rowIdx, "company", v)}
                          options={toOptions(refs.companies)}
                          placeholder="Company"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <GridSelectCell
                          value={row.category}
                          onChange={(v) => updateCell(rowIdx, "category", v)}
                          options={toOptions(refs.categories)}
                          placeholder="Category"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <GridSelectCell
                          value={row.size}
                          onChange={(v) => updateCell(rowIdx, "size", v)}
                          options={toOptions(refs.sizes)}
                          placeholder="Packaging"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <GridSelectCell
                          value={row.potency}
                          onChange={(v) => updateCell(rowIdx, "potency", v)}
                          options={toOptions(refs.potencies)}
                          placeholder={isMed ? "Optional" : "N/A"}
                          disabled={!isMed}
                        />
                      </td>

                      <td className="px-1 py-1">
                        <GridMultiSelectCell
                          value={row.useTypes}
                          onChange={(v) => updateCell(rowIdx, "useTypes", v)}
                          options={toOptions(refs.useTypes)}
                          placeholder="Indications"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <input
                          type="number"
                          value={row.lowStockThreshold}
                          onChange={(e) => updateCell(rowIdx, "lowStockThreshold", e.target.value)}
                          placeholder="10"
                          className="w-full min-w-[50px] px-2 py-1.5 border border-gray-200 rounded text-xs"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <input
                          type="text"
                          value={row.hsnCode}
                          onChange={(e) => updateCell(rowIdx, "hsnCode", e.target.value)}
                          placeholder="3004"
                          className="w-full min-w-[60px] px-2 py-1.5 border border-gray-200 rounded text-xs"
                        />
                      </td>

                      <td className="px-1 py-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => duplicateRow(rowIdx)}
                            className="p-1 text-blue-400 hover:text-blue-600 rounded"
                            title="Duplicate row"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeRow(rowIdx)}
                            disabled={gridRows.length <= 1}
                            className="p-1 text-red-400 hover:text-red-600 rounded disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition"
          >
            <Plus className="w-4 h-4" />
            Add New Row
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Confirming registration of {gridRows.filter((r) => r.productName || r.medicine || r.company).length} items
          </h3>

          <div className="border rounded-lg overflow-auto max-h-[60vh]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-gray-100 z-10">
                <tr>
                  <th className="px-3 py-2 text-gray-500 w-8">#</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Type</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Product</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Company</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Category</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Size</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Potency</th>
                  <th className="px-3 py-2 text-gray-600 text-left">Use Types</th>
                  <th className="px-3 py-2 text-gray-600 text-right">Low Stock Alert</th>
                  <th className="px-3 py-2 text-gray-600 text-left">HSN</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gridRows
                  .filter((r) => r.productName || r.medicine || r.company)
                  .map((row, idx) => {
                    const isMed = row.productType === "medicine";
                    const { invalid } = validateRows([row]);
                    const hasErrors = invalid.length > 0;

                    return (
                      <tr key={idx} className={hasErrors ? "bg-red-50" : "hover:bg-gray-50"}>
                        <td className="px-3 py-2 text-gray-400">
                          {hasErrors ? <XCircle className="w-4 h-4 text-red-500" /> : idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${isMed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {isMed ? "💊 Medicine" : "🧴 General"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-800">
                          {getRowDisplayName(row)}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{getRefName(refs.companies, row.company)}</td>
                        <td className="px-3 py-2 text-gray-600">{getRefName(refs.categories, row.category)}</td>
                        <td className="px-3 py-2 text-gray-600">{getRefName(refs.sizes, row.size)}</td>
                        <td className="px-3 py-2 text-gray-600 font-bold text-purple-700">
                          {row.potency ? getRefName(refs.potencies, row.potency) : "-"}
                        </td>
                        <td className="px-3 py-2 text-gray-500">
                          {row.useTypes.length > 0
                            ? row.useTypes.map((id) => getRefName(refs.useTypes, id)).join(", ")
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-right">{row.lowStockThreshold}</td>
                        <td className="px-3 py-2 text-gray-600">{row.hsnCode}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {(() => {
            const nonEmptyRows = gridRows.filter((r) => r.productName || r.medicine || r.company);
            const { invalid } = validateRows(nonEmptyRows);
            if (invalid.length === 0) return null;
            return (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-red-700 flex items-center gap-1 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  {invalid.length} entries contain missing parameters and will be skipped:
                </p>
                <ul className="text-xs text-red-600 space-y-0.5 max-h-24 overflow-y-auto">
                  {invalid.map((err, i) => (
                    <li key={i}>• Row {err.row}: {err.errors.join(", ")}</li>
                  ))}
                </ul>
              </div>
            );
          })()}
        </div>
      )}

      {step === 3 && results && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-800">{results.totalAttempted}</p>
              <p className="text-xs text-gray-500">Attempted</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700">{results.success || 0}</p>
              <p className="text-xs text-green-600">Created</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">
                {(results.failed || 0) + (results.validationErrors?.length || 0)}
              </p>
              <p className="text-xs text-red-600">Failed / Skipped</p>
            </div>
          </div>

          {results.errors?.length > 0 && (
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Submission Errors
              </h4>
              <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {results.errors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}