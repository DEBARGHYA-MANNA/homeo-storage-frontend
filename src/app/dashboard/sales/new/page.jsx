"use client";

import { useState, useEffect } from "react";
import productService from "@/services/productService";
import saleService from "@/services/saleService";
import {
  ShoppingCart,
  Search,
  Plus,
  Trash2,
  Minus,
  Receipt,
  ArrowLeft,
  Loader2,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function NewSalePage() {
  const router = useRouter();

  // Product search
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);

  // Sale details
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("amount");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ============================================
  // SEARCH PRODUCTS
  // ============================================
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await productService.getAll({ search: searchTerm, limit: 10 });
        if (res.success) {
          setSearchResults(res.data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ============================================
  // ADD TO CART
  // ============================================
  const addToCart = (product) => {
    // Check if already in cart
    const existing = cart.find((item) => item.productId === product._id);

    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error(`Only ${product.stock} units available`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
            : item
        )
      );
    } else {
      if (product.stock <= 0) {
        toast.error("This product is out of stock");
        return;
      }
      setCart([
        ...cart,
        {
          productId: product._id,
          name: product.medicine?.name || product.productName || "Product",
          company: product.company?.name || "",
          size: product.size?.name || "",
          potency: product.potency?.name || "",
          mrp: product.mrp,
          unitPrice: product.mrp, // Default selling price = MRP
          quantity: 1,
          totalPrice: product.mrp,
          maxStock: product.stock,
        },
      ]);
    }

    setSearchTerm("");
    setSearchResults([]);
    toast.success("Added to cart");
  };

  // ============================================
  // UPDATE CART ITEM
  // ============================================
  const updateQuantity = (index, delta) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = item.quantity + delta;
        if (newQty < 1 || newQty > item.maxStock) return item;
        return { ...item, quantity: newQty, totalPrice: newQty * item.unitPrice };
      })
    );
  };

  const updatePrice = (index, price) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, unitPrice: Number(price), totalPrice: item.quantity * Number(price) };
      })
    );
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // ============================================
  // CALCULATIONS
  // ============================================
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discount) / 100
      : discount;
  const totalAmount = Math.max(0, subtotal - discountAmount);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ============================================
  // SUBMIT SALE
  // ============================================
  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Please add at least one item to the cart");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customerName,
        customerPhone,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discount: discountAmount,
        discountType,
        paymentMethod,
        paymentStatus: "paid",
        notes,
      };

      const res = await saleService.create(payload);

      if (res.success) {
        toast.success(`Sale ${res.data.saleNumber} completed! 🎉`);
        setCart([]);
        setCustomerName("Walk-in Customer");
        setCustomerPhone("");
        setDiscount(0);
        setNotes("");
        router.push("/dashboard/sales");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create sale");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/sales" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-green-700" />
            New Sale
          </h1>
          <p className="text-gray-500 text-sm">
            Search products, add to cart, and complete the sale
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============================================ */}
        {/* LEFT: Product Search & Cart (2 cols)         */}
        {/* ============================================ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Search & Add Products
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type medicine name, product name..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg
                           text-base focus:outline-none focus:ring-2 focus:ring-green-500
                           focus:border-transparent"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-3 w-5 h-5 text-green-600 animate-spin" />
              )}
            </div>

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                {searchResults.map((product) => {
                  const name = product.medicine?.name || product.productName;
                  const inCart = cart.find((c) => c.productId === product._id);

                  return (
                    <div
                      key={product._id}
                      className="flex items-center justify-between px-4 py-3
                                 hover:bg-green-50 border-b last:border-b-0 transition"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {product.medicine ? "💊" : "🧴"} {name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {product.company?.name} • {product.size?.name}
                          {product.potency ? ` • ${product.potency.name}` : ""}
                          {" • "}Stock: {product.stock}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-800">
                          ₹{product.mrp}
                        </span>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0 || (inCart && inCart.quantity >= product.stock)}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700
                                     transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Cart Items ({totalItems})
              </h2>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty. Search and add products above.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map((item, index) => (
                  <div key={index} className="px-4 py-3 flex items-center gap-3">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.company} • {item.size}
                        {item.potency ? ` • ${item.potency}` : ""}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(index, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded
                                   bg-gray-100 hover:bg-gray-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(index, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded
                                   bg-gray-100 hover:bg-gray-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price Input */}
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updatePrice(index, e.target.value)}
                        className="w-full text-sm text-right border border-gray-200
                                   rounded px-2 py-1 focus:outline-none focus:ring-1
                                   focus:ring-green-500"
                      />
                    </div>

                    {/* Total */}
                    <span className="text-sm font-bold text-gray-800 w-16 text-right">
                      ₹{item.totalPrice}
                    </span>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(index)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT: Summary & Checkout (1 col)            */}
        {/* ============================================ */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Customer Info</h3>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {["cash", "upi", "card", "credit"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border-2 transition
                    ${paymentMethod === method
                      ? "border-green-600 bg-green-50 text-green-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                >
                  {method === "cash" && "💵 "}
                  {method === "upi" && "📱 "}
                  {method === "card" && "💳 "}
                  {method === "credit" && "📒 "}
                  {method.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Discount</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="amount">₹ Flat</option>
                <option value="percentage">% Off</option>
              </select>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <h3 className="font-semibold text-gray-800 text-sm">Bill Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({totalItems} items)</span>
                <span>₹{subtotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>-₹{Math.round(discountAmount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-800">
                <span>Total</span>
                <span className="text-green-700">₹{Math.round(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Complete Sale Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3.5
                       bg-green-700 text-white rounded-xl font-semibold text-base
                       hover:bg-green-800 transition shadow-lg shadow-green-700/20
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IndianRupee className="w-5 h-5" />
                Complete Sale — ₹{Math.round(totalAmount)}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}