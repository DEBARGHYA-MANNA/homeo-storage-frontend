"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import StockInput from "@/components/stock/StockInput";
import stockService from "@/services/stockService";
import { Loader2, Package, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const reasons = [
  { value: "damaged", label: "Damaged", emoji: "🔨" },
  { value: "expired", label: "Expired", emoji: "⏰" },
  { value: "returned", label: "Returned", emoji: "↩️" },
  { value: "adjustment_remove", label: "Adjustment", emoji: "📉" },
  { value: "transfer", label: "Transferred", emoji: "🚚" },
  { value: "other", label: "Other", emoji: "📝" },
];

export default function RemoveStockModal({ isOpen, onClose, product, onSuccess }) {
  const [form, setForm] = useState({
    batchId: "",
    quantity: "",
    reason: "damaged",
    reasonNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        batchId: "",
        quantity: "",
        reason: "damaged",
        reasonNote: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const err = {};
    if (!form.quantity || Number(form.quantity) <= 0) err.quantity = "Required (> 0)";
    if (Number(form.quantity) > product.stock) err.quantity = `Max ${product.stock} available`;
    if (!form.reason) err.reason = "Select reason";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await stockService.removeStock({
        productId: product._id,
        batchId: form.batchId || undefined,
        quantity: Number(form.quantity),
        reason: form.reason,
        reasonNote: form.reasonNote,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const displayName = product.medicine?.name || product.productName || "Product";
  const activeBatches = product.batches?.filter((b) => b.quantity > 0) || [];
  const newStock = Math.max(0, product.stock - Number(form.quantity || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Stock"
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Removing..." : "Confirm Removal"}
          </button>
        </>
      }
    >
      {/* Product Info */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="bg-white rounded-lg p-2.5 shadow-sm">
            <Package className="w-6 h-6 text-red-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800">
              {product.medicine ? "💊" : "🧴"} {displayName}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
              <span className="font-medium">{product.company?.name}</span>
              <span>•</span>
              <span>{product.size?.name}</span>
              {product.potency && (
                <>
                  <span>•</span>
                  <span className="text-purple-700 font-semibold bg-purple-100 px-1.5 py-0.5 rounded">
                    {product.potency.name}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-sm">
              Available: <strong className="text-red-700">{product.stock}</strong> units
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Batch Selection */}
        {activeBatches.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Select Batch
            </label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium
                         bg-gray-50 text-gray-800
                         focus:outline-none focus:border-red-500 focus:bg-white transition"
            >
              <option value="">🔄 Auto (FIFO - oldest first)</option>
              {activeBatches.map((b) => {
                const expiry = b.expiryDate
                  ? new Date(b.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                  : "No expiry";
                return (
                  <option key={b._id} value={b._id}>
                    {b.batchNumber} • {b.quantity} units • Exp: {expiry} • ₹{b.mrp}
                  </option>
                );
              })}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              💡 Default is FIFO (first in, first out). Select a specific batch to override.
            </p>
          </div>
        )}

        {/* Quantity */}
        <StockInput
          label="Quantity to Remove"
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
          placeholder="0"
          required
          min="1"
          max={product.stock}
          error={errors.quantity}
          autoFocus
          suffix="units"
        />

        {/* Reason Buttons */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {reasons.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm({ ...form, reason: r.value })}
                className={`px-3 py-2.5 rounded-lg text-xs font-semibold border-2 transition
                  ${form.reason === r.value
                    ? "border-red-500 bg-red-50 text-red-700 shadow-sm"
                    : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                  }`}
              >
                <div className="text-base">{r.emoji}</div>
                <div className="mt-0.5">{r.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            Note / Details
          </label>
          <textarea
            name="reasonNote"
            value={form.reasonNote}
            onChange={handleChange}
            placeholder="Details about this removal..."
            rows={2}
            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium
                       bg-gray-50 text-gray-800
                       focus:outline-none focus:border-red-500 focus:bg-white
                       transition placeholder:text-gray-400 placeholder:font-normal resize-none"
          />
        </div>

        {/* Live Preview */}
        {form.quantity && Number(form.quantity) > 0 && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">
                    Removing {form.quantity} units
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Stock Movement
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Remaining</p>
                <p className="text-2xl font-bold text-gray-800">
                  <span className="text-gray-400 text-lg mr-1">{product.stock} →</span>
                  <span className={newStock === 0 ? "text-red-600" : "text-gray-800"}>
                    {newStock}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}