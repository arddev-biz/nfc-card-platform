"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative flex h-full w-full max-w-2xl flex-col bg-[var(--admin-card)] shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--admin-text)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-[var(--admin-text-secondary)] hover:bg-[var(--admin-border)] hover:text-[var(--admin-text)]"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
