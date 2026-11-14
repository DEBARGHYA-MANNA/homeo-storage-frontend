"use client";

import Modal from "@/components/Modal";
import { Loader2, Package } from "lucide-react";

export default function BatchViewModal({ isOpen, onClose, data, loading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📦 Batch Details — ${data?.displayName || ""}`}
      size="xl"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-700" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {data.company} • {data.size}
                    {data.potency ? ` • ${data.potency}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {data.batches.length} active batch{data.batches.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Stock</p>
                <p className="text-3xl font-bold text-green-700">{data.totalStock}</p>
              </div>
            </div>
          </div>

          {/* Batches Table */}
          {data.batches.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No active batches</p>
            </div>
          ) : (
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200">
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Batch</th>
                    <th className="text-center px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Qty</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Cost</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">MRP</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Customer ₹</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase hidden sm:table-cell">Doctor ₹</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase">Expiry</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-bold text-gray-500 uppercase hidden lg:table-cell">Rack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.batches.map((batch) => {
                    const isExpired = batch.expiryDate && new Date(batch.expiryDate) < new Date();
                    const expiryClose = batch.expiryDate &&
                      new Date(batch.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

                    return (
                      <tr
                        key={batch._id}
                        className={`${isExpired ? "bg-red-50" : expiryClose && !isExpired ? "bg-yellow-50" : "hover:bg-gray-50"}`}
                      >
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-800 font-medium">
                          {batch.batchNumber || "-"}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold text-gray-800">
                          {batch.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">
                          ₹{batch.purchasePrice}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-800">
                          ₹{batch.mrp}
                        </td>
                        <td className="px-3 py-2.5 text-right text-blue-700 hidden sm:table-cell">
                          ₹{batch.sellingPriceCustomer || batch.mrp}
                        </td>
                        <td className="px-3 py-2.5 text-right text-purple-700 hidden sm:table-cell">
                          ₹{batch.sellingPriceDoctor || batch.mrp}
                        </td>
                        <td className="px-3 py-2.5">
                          {batch.expiryDate ? (
                            <span className={`text-xs font-medium ${isExpired ? "text-red-600" : expiryClose ? "text-yellow-700" : "text-gray-600"}`}>
                              {new Date(batch.expiryDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                              {isExpired && " ⚠️"}
                              {expiryClose && !isExpired && " ⏰"}
                            </span>
                          ) : "-"}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 hidden lg:table-cell">
                          {batch.rackLocation || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-50 border-2 border-red-200 rounded"></span>
              Expired
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-50 border-2 border-yellow-200 rounded"></span>
              Expiring &lt; 90 days
            </span>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}