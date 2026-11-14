"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import StockInput from "@/components/stock/StockInput";
import stockService from "@/services/stockService";
import { Loader2, ShoppingCart, User, Stethoscope, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

export default function QuickSaleModal({ isOpen, onClose, product, onSuccess }) {
  // ============================================
  // CUSTOMER TYPE TAB (default: customer)
  // ============================================
  const [customerType, setCustomerType] = useState("customer"); // "customer" or "doctor"

  const [form, setForm] = useState({
    batchId: "",
    quantity: "1",
    sellingPrice: "",
    customerName: "",
    customerPhone: "",
    paymentMethod: "cash",
    reasonNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ============================================
  // Reset when modal opens
  // ============================================
  useEffect(() => {
    if (isOpen && product) {
      setCustomerType("customer"); // Reset to Customer tab
      const defaultPrice = product.sellingPriceCustomer || product.mrp || "";
      setForm({
        batchId: "",
        quantity: "1",
        sellingPrice: defaultPrice,
        customerName: "",
        customerPhone: "",
        paymentMethod: "cash",
        reasonNote: "",
      });
      setErrors({});
    }
  }, [isOpen, product]);

  // ============================================
  // Auto-update price based on customer type
  // Priority: Batch-specific price > Product-level price > MRP
  // ============================================
  useEffect(() => {
    if (!product) return;

    let price = 0;
    const batch = form.batchId ? product.batches?.find((b) => b._id === form.batchId) : null;

    if (customerType === "doctor") {
      // Doctor price priority
      if (batch?.sellingPriceDoctor) price = batch.sellingPriceDoctor;
      else if (product.sellingPriceDoctor) price = product.sellingPriceDoctor;
      else if (batch?.mrp) price = batch.mrp;
      else price = product.mrp || 0;
    } else {
      // Customer price priority
      if (batch?.sellingPriceCustomer) price = batch.sellingPriceCustomer;
      else if (product.sellingPriceCustomer) price = product.sellingPriceCustomer;
      else if (batch?.mrp) price = batch.mrp;
      else price = product.mrp || 0;
    }

    setForm((prev) => ({ ...prev, sellingPrice: price }));
  }, [customerType, form.batchId, product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    const err = {};
    if (!form.quantity || Number(form.quantity) <= 0) err.quantity = "Required (> 0)";
    if (Number(form.quantity) > product.stock) err.quantity = `Max ${product.stock} available`;
    if (!form.sellingPrice || Number(form.sellingPrice) <= 0) err.sellingPrice = "Required";
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const customerLabel = customerType === "doctor"
        ? `Dr. ${form.customerName || "Unknown"}`
        : form.customerName || "Walk-in Customer";

      const noteWithType = [
        `[${customerType === "doctor" ? "DOCTOR SALE" : "CUSTOMER SALE"}]`,
        form.reasonNote,
      ].filter(Boolean).join(" ");

      const res = await stockService.quickSell({
        productId: product._id,
        batchId: form.batchId || undefined,
        quantity: Number(form.quantity),
        sellingPrice: Number(form.sellingPrice),
        customerName: customerLabel,
        customerPhone: form.customerPhone,
        paymentMethod: form.paymentMethod,
        reasonNote: noteWithType,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process sale");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const displayName = product.medicine?.name || product.productName || "Product";
  const activeBatches = product.batches?.filter((b) => b.quantity > 0) || [];
  const total = Number(form.quantity || 0) * Number(form.sellingPrice || 0);

  // Price comparison helpers
  const customerDefaultPrice = product.sellingPriceCustomer || product.mrp || 0;
  const doctorDefaultPrice = product.sellingPriceDoctor || product.mrp || 0;
  const mrp = product.mrp || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Sale"
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
            className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50
              ${customerType === "doctor" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Processing..." : `Complete Sale — ₹${total.toLocaleString("en-IN")}`}
          </button>
        </>
      }
    >
      {/* Product Info */}
      <div className={`border-2 rounded-xl p-4 mb-5 transition-colors
        ${customerType === "doctor" ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"}`}>
        <div className="flex items-start gap-3">
          <div className="bg-white rounded-lg p-2.5 shadow-sm">
            <ShoppingCart className={`w-6 h-6 ${customerType === "doctor" ? "text-purple-700" : "text-blue-700"}`} />
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
              Available: <strong className={customerType === "doctor" ? "text-purple-700" : "text-blue-700"}>
                {product.stock}
              </strong> units
            </p>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* CUSTOMER TYPE TABS                           */}
      {/* ============================================ */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
          🧾 Sale Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCustomerType("customer")}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold border-2 transition
              ${customerType === "customer"
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
          >
            <User className="w-5 h-5" />
            <div className="text-left">
              <div>Customer</div>
              <div className="text-[10px] font-normal opacity-70">
                ₹{customerDefaultPrice} per unit
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setCustomerType("doctor")}
            className={`flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold border-2 transition
              ${customerType === "doctor"
                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md shadow-purple-100"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
              }`}
          >
            <Stethoscope className="w-5 h-5" />
            <div className="text-left">
              <div>Doctor</div>
              <div className="text-[10px] font-normal opacity-70">
                ₹{doctorDefaultPrice} per unit
                {doctorDefaultPrice < customerDefaultPrice && doctorDefaultPrice > 0 && (
                  <span className="ml-1 text-green-600">
                    (Save ₹{customerDefaultPrice - doctorDefaultPrice})
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Batch Selection */}
        {activeBatches.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Select Batch (FIFO by default)
            </label>
            <select
              name="batchId"
              value={form.batchId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium
                         bg-gray-50 text-gray-800
                         focus:outline-none focus:border-blue-500 focus:bg-white transition"
            >
              <option value="">🔄 Auto (Oldest first)</option>
              {activeBatches.map((b) => {
                const price = customerType === "doctor"
                  ? (b.sellingPriceDoctor || b.mrp)
                  : (b.sellingPriceCustomer || b.mrp);
                return (
                  <option key={b._id} value={b._id}>
                    {b.batchNumber} • {b.quantity} units • ₹{price}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* Qty & Price */}
        <div className="grid grid-cols-2 gap-4">
          <StockInput
            label="Quantity"
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
          <StockInput
            label={`Price Per Unit (${customerType === "doctor" ? "Doctor" : "Customer"})`}
            name="sellingPrice"
            type="number"
            value={form.sellingPrice}
            onChange={handleChange}
            placeholder="0.00"
            required
            prefix="₹"
            step="0.01"
            error={errors.sellingPrice}
            hint={
              customerType === "doctor"
                ? `Default doctor price: ₹${doctorDefaultPrice}`
                : `Default customer price: ₹${customerDefaultPrice}`
            }
          />
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4">
          <StockInput
            label={customerType === "doctor" ? "Doctor Name" : "Customer Name"}
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
            placeholder={customerType === "doctor" ? "Dr. Sharma" : "Walk-in"}
          />
          <StockInput
            label="Phone"
            name="customerPhone"
            type="tel"
            value={form.customerPhone}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            💳 Payment Method
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: "cash", label: "Cash", emoji: "💵" },
              { value: "upi", label: "UPI", emoji: "📱" },
              { value: "card", label: "Card", emoji: "💳" },
              { value: "credit", label: "Credit", emoji: "📒" },
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setForm({ ...form, paymentMethod: method.value })}
                className={`py-2.5 px-3 rounded-lg text-xs font-semibold border-2 transition
                  ${form.paymentMethod === method.value
                    ? customerType === "doctor"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                  }`}
              >
                <div>{method.emoji}</div>
                <div className="mt-0.5">{method.label.toUpperCase()}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
            📝 Note (Optional)
          </label>
          <input
            type="text"
            name="reasonNote"
            value={form.reasonNote}
            onChange={handleChange}
            placeholder="Any special note about this sale..."
            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium
                       bg-gray-50 text-gray-800
                       focus:outline-none focus:border-blue-500 focus:bg-white transition
                       placeholder:text-gray-400"
          />
        </div>

        {/* Live Total */}
        <div className={`border-2 rounded-xl p-4 flex items-center justify-between transition-colors
          ${customerType === "doctor" ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"}`}>
          <div className="flex items-center gap-2">
            <TrendingUp className={`w-5 h-5 ${customerType === "doctor" ? "text-purple-600" : "text-blue-600"}`} />
            <div>
              <p className="text-xs text-gray-600 font-medium">
                {form.quantity || 0} × ₹{form.sellingPrice || 0}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                {customerType === "doctor" ? "Doctor Price" : "Customer Price"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className={`text-2xl font-bold ${customerType === "doctor" ? "text-purple-700" : "text-blue-700"}`}>
              ₹{total.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}