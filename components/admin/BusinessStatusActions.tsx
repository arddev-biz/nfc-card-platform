"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type OrgStatus = "ACTIVE" | "SUSPENDED" | "ARCHIVED";

interface StatusAction {
  label: string;
  nextStatus: OrgStatus;
  confirmMessage: string;
}

function getAvailableActions(currentStatus: OrgStatus): StatusAction[] {
  switch (currentStatus) {
    case "ACTIVE":
      return [
        {
          label: "Suspend",
          nextStatus: "SUSPENDED",
          confirmMessage: "Suspend this business? Its public profile behavior may change once that's built.",
        },
        {
          label: "Archive",
          nextStatus: "ARCHIVED",
          confirmMessage: "Archive this business? This removes it from active use without deleting its data.",
        },
      ];
    case "SUSPENDED":
      return [
        {
          label: "Activate",
          nextStatus: "ACTIVE",
          confirmMessage: "Reactivate this business?",
        },
        {
          label: "Archive",
          nextStatus: "ARCHIVED",
          confirmMessage: "Archive this business? This removes it from active use without deleting its data.",
        },
      ];
    case "ARCHIVED":
      return [
        {
          label: "Restore",
          nextStatus: "ACTIVE",
          confirmMessage: "Restore this business to active status?",
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
  const [isUpdating, setIsUpdating] = useState(false);
  const actions = getAvailableActions(currentStatus);

  async function handleAction(action: StatusAction) {
    if (!window.confirm(action.confirmMessage)) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action.nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error ?? "Something went wrong updating the status.");
        return;
      }

      router.refresh();
    } finally {
      setIsUpdating(false);
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
          onClick={() => handleAction(action)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
