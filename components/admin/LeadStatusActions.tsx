"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type LeadStatus = "NEW" | "CONTACTED" | "CONVERTED" | "CLOSED";

function availableActions(status: LeadStatus): { label: string; next: "NEW" | "CONTACTED" | "CLOSED" }[] {
  switch (status) {
    case "NEW":
      return [
        { label: "Mark as contacted", next: "CONTACTED" },
        { label: "Close", next: "CLOSED" },
      ];
    case "CONTACTED":
      return [
        { label: "Mark as new", next: "NEW" },
        { label: "Close", next: "CLOSED" },
      ];
    case "CLOSED":
      return [{ label: "Reopen as new", next: "NEW" }];
    case "CONVERTED":
    default:
      return [];
  }
}

export function LeadStatusActions({ leadId, currentStatus }: { leadId: string; currentStatus: LeadStatus }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const actions = availableActions(currentStatus);

  async function handleAction(next: "NEW" | "CONTACTED" | "CLOSED") {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error ?? "Something went wrong updating this lead.");
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
          key={action.next}
          type="button"
          variant="secondary"
          disabled={isUpdating}
          onClick={() => handleAction(action.next)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}
