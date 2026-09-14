"use client";

import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  isDestructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  isDestructive = false,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-semibold text-[var(--admin-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-sm text-[var(--admin-text-secondary)]">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isBusy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Please wait…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
