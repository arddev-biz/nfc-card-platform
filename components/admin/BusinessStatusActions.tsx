"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type OrgStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

interface StatusAction {
  label: string;
  nextStatus: OrgStatus;
  confirmTitle: string;
  confirmDescription: string;
  isDestructive: boolean;
}

function getAvailableActions(currentStatus: OrgStatus): StatusAction[] {
  switch (currentStatus) {
    case "ACTIVE":
      return [
        {
          label: "Suspend",
          nextStatus: "SUSPENDED",
          confirmTitle: "Suspend this business?",
          confirmDescription: "Its public profile behavior may change once that's built.",
          isDestructive: true,
        },
        {
          label: "Archive",
          nextStatus: "ARCHIVED",
          confirmTitle: "Archive this business?",
          confirmDescription: "This removes it from active use without deleting its data.",
          isDestructive: true,
        },
      ];
    case "SUSPENDED":
      return [
        {
          label: "Activate",
          nextStatus: "ACTIVE",
          confirmTitle: "Reactivate this business?",
          confirmDescription: "",
          isDestructive: false,
        },
        {
          label: "Archive",
          nextStatus: "ARCHIVED",
          confirmTitle: "Archive this business?",
          confirmDescription: "This removes it from active use without deleting its data.",
          isDestructive: true,
        },
      ];
    case "ARCHIVED":
      return [
        {
          label: "Restore",
          nextStatus: "ACTIVE",
          confirmTitle: "Restore this business to active status?",
          confirmDescription: "",
          isDestructive: false,
        },
      ];
    default:
      return [];
  }
}

export function BusinessStatusActions({
  organizationId,
  currentStatus,
}: {
  organizationId: string;
  currentStatus: OrgStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null);
  const actions = getAvailableActions(currentStatus);

  async function handleConfirm() {
    if (!pendingAction) return;
    const action = pendingAction;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        showToast(data.error ?? "Something went wrong updating the status.", "error");
        return;
      }

      showToast(`Business ${action.label.toLowerCase()}d successfully.`);
      router.refresh();
    } finally {
      setIsUpdating(false);
      setPendingAction(null);
    }
  }

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.nextStatus}
          type="button"
          variant="secondary"
          disabled={isUpdating}
          onClick={() => setPendingAction(action)}
        >
          {action.label}
        </Button>
      ))}

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.confirmTitle ?? ""}
        description={pendingAction?.confirmDescription}
        confirmLabel={pendingAction?.label}
        isDestructive={pendingAction?.isDestructive}
        isBusy={isUpdating}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
