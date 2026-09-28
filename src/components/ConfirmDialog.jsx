"use client";

import Modal from "./Modal";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName = "",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-4">
        {/* Warning Icon */}
        <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-600" />
        </div>

        {/* Message */}
        <p className="text-gray-600 text-sm mb-1">{message}</p>
        {itemName && (
          <p className="text-gray-800 font-semibold text-base">
            &ldquo;{itemName}&rdquo;
          </p>
        )}
        <p className="text-red-500 text-xs mt-3">
          This action cannot be undone.
        </p>
      </div>

      {/* Footer is inside modal body for this small dialog */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg
                     text-sm font-medium text-gray-700
                     hover:bg-gray-50 transition disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg
                     text-sm font-medium hover:bg-red-700
                     transition disabled:opacity-50"
        >
          {loading ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
