"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import StockInput from "@/components/stock/StockInput";
import stockService from "@/services/stockService";
import { Loader2, Package, TrendingUp, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AddStockModal({ isOpen, onClose, product, onSuccess }) {
  const [form, setForm] = useState({
    batchNumber: "",
    quantity: "",
    purchasePrice: "",
    mrp: "",
    sellingPriceCustomer: "",
    sellingPriceDoctor: "",
    expiryDate: "",
    rackLocation: "",
    reasonNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && product) {
      setForm({
        batchNumber: generateBatchNumber(),
        quantity: "",
        purchasePrice: product.purchasePrice || "",
        mrp: product.mrp || "",
        sellingPriceCustomer: product.sellingPriceCustomer || product.mrp || "",
        sellingPriceDoctor: product.sellingPriceDoctor || product.mrp || "",
        expiryDate: "",
        rackLocation: product.rackLocation || "",
        reasonNote: "",
      });
      setErrors({});
    }
  }, [isOpen, product]);

  const generateBatchNumber = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `B-${dateStr}-${random}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    // Auto-fill selling prices when MRP changes and they are empty or equal to old MRP
    if (name === "mrp") {
      if (!form.sellingPriceCustomer || form.sellingPriceCustomer === form.mrp) {
        updated.sellingPriceCustomer = value;
      }
      if (!form.sellingPriceDoctor || form.sellingPriceDoctor === form.mrp) {
        updated.sellingPriceDoctor = value;
      }
    }

    setForm(updated);
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const err = {};
    if (!form.quantity || Number(form.quantity) <= 0) err.quantity = "Required (> 0)";
    if (!form.purchasePrice || Number(form.purchasePrice) < 0) err.purchasePrice = "Required";
    if (!form.mrp || Number(form.mrp) < 0) err.mrp = "Required";
    if (Number(form.purchasePrice) > Number(form.mrp)) {
      err.purchasePrice = "Should be less than MRP";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      const res = await stockService.addStock({
        productId: product._id,
        batchNumber: form.batchNumber,
        quantity: Number(form.quantity),
        purchasePrice: Number(form.purchasePrice),
        mrp: Number(form.mrp),
        sellingPriceCustomer: Number(form.sellingPriceCustomer) || Number(form.mrp),
        sellingPriceDoctor: Number(form.sellingPriceDoctor) || Number(form.mrp),
        expiryDate: form.expiryDate || null,
        rackLocation: form.rackLocation,
        reasonNote: form.reasonNote,
      });

      if (res.success) {
        toast.success(res.message);
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const displayName = product.medicine?.name || product.productName || "Product";
  const profit = form.mrp && form.purchasePrice && Number(form.purchasePrice) > 0
    ? (((Number(form.mrp) - Number(form.purchasePrice)) / Number(form.purchasePrice)) * 100).toFixed(1)
    : 0;
  const totalInvestment = Number(form.quantity || 0) * Number(form.purchasePrice || 0);
  const newTotalStock = Number(product.stock) + Number(form.quantity || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Stock Batch"
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
            className="flex items-center gap-2 px-6 py-2.5 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Adding..." : "Confirm & Add Stock"}
          </button>
        </>
      }
    >
      {/* Product Header */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="bg-white rounded-lg p-2.5 shadow-sm">
            <Package className="w-6 h-6 text-green-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-800">
              {product.medicine ? "💊" : "🧴"} {displayName}
            </h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-600">
              <span className="font-medium">{product.company?.name}</span>
              <span>•</span>
              <span>{product.category?.name}</span>
              <span>•</span>
              <span>{product.size?.name}</span>
              {product.potency && (
                <>
                  <span>•</span>
                  <span className="text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded">
                    {product.potency.name}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1.5 text-sm text-green-800">
              Current Stock: <strong className="text-green-700 text-base">{product.stock}</strong> units
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Section: Batch & Quantity */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">
            📦 Batch & Quantity
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <StockInput
              label="Batch Number"
              name="batchNumber"
              value={form.batchNumber}
              onChange={handleChange}
              placeholder="B-20250115-001"
              suffix={
                <button
                  type="button"
                  onClick={() => setForm({ ...form, batchNumber: generateBatchNumber() })}
                  className="text-green-600 hover:text-green-800 text-xs font-semibold"
                >
                  🔄
                </button>
              }
            />
            <StockInput
              label="Quantity"
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              placeholder="Enter units"
              required
              min="1"
              error={errors.quantity}
              autoFocus
              suffix="units"
            />
          </div>
        </div>

        {/* Section: Pricing */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">
            💰 Pricing (per unit)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <StockInput
              label="Purchase Price"
              name="purchasePrice"
              type="number"
              value={form.purchasePrice}
              onChange={handleChange}
              placeholder="Cost price"
              required
              prefix="₹"
              step="0.01"
              error={errors.purchasePrice}
              hint="What you paid the supplier"
            />
            <StockInput
              label="MRP (Maximum Retail Price)"
              name="mrp"
              type="number"
              value={form.mrp}
              onChange={handleChange}
              placeholder="Printed on product"
              required
              prefix="₹"
              step="0.01"
              error={errors.mrp}
              hint="Printed price on packaging"
            />
            <StockInput
              label="Selling Price (Customer)"
              name="sellingPriceCustomer"
              type="number"
              value={form.sellingPriceCustomer}
              onChange={handleChange}
              placeholder="Customer rate"
              prefix="₹"
              step="0.01"
              hint="Price for walk-in customers"
            />
            <StockInput
              label="Selling Price (Doctor)"
              name="sellingPriceDoctor"
              type="number"
              value={form.sellingPriceDoctor}
              onChange={handleChange}
              placeholder="Doctor / wholesale rate"
              prefix="₹"
              step="0.01"
              hint="Discounted price for doctors/clinics"
            />
          </div>
        </div>

        {/* Section: Expiry & Storage */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">
            📅 Expiry & Storage
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <StockInput
              label="Expiry Date"
              name="expiryDate"
              type="date"
              value={form.expiryDate}
              onChange={handleChange}
              min={new Date().toISOString().split("T")[0]}
            />
            <StockInput
              label="Rack / Shelf Location"
              name="rackLocation"
              value={form.rackLocation}
              onChange={handleChange}
              placeholder="e.g., A1-R2, Shelf 3"
              hint="Where this batch is stored"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b pb-2">
            📝 Purchase Notes
          </h4>
          <textarea
            name="reasonNote"
            value={form.reasonNote}
            onChange={handleChange}
            placeholder="Invoice #, supplier name, delivery details..."
            rows={2}
            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg text-sm bg-gray-50
                       focus:outline-none focus:border-green-500 focus:bg-white
                       transition placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Live Summary */}
        {(form.quantity || form.purchasePrice) && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Investment</p>
                <p className="text-lg font-bold text-gray-800">
                  ₹{totalInvestment.toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">New Stock</p>
                <p className="text-lg font-bold text-green-700">{newTotalStock}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Margin</p>
                <p className={`text-lg font-bold ${Number(profit) > 0 ? "text-green-700" : "text-red-500"}`}>
                  {profit}%
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase">Dr. Discount</p>
                <p className="text-lg font-bold text-blue-700">
                  {form.mrp && form.sellingPriceDoctor && Number(form.mrp) > 0
                    ? `${(((Number(form.mrp) - Number(form.sellingPriceDoctor)) / Number(form.mrp)) * 100).toFixed(0)}%`
                    : "0%"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}