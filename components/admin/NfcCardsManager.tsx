"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { NFCCard, CardStatus } from "@prisma/client";
import { getCardUrl } from "@/lib/site";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface ReassignTarget {
  id: string;
  name: string;
}

interface NfcCardsManagerProps {
  organizationId: string;
  cards: NFCCard[];
  reassignTargets: ReassignTarget[];
}

function statusTone(status: CardStatus): "green" | "amber" | "gray" {
  switch (status) {
    case "ACTIVE":
      return "green";
    case "SUSPENDED":
      return "amber";
    default:
      return "gray";
  }
}

function availableStatusActions(status: CardStatus): { label: string; next: CardStatus }[] {
  switch (status) {
    case "ACTIVE":
      return [
        { label: "Deactivate", next: "SUSPENDED" },
        { label: "Mark as replaced", next: "REPLACED" },
      ];
    case "SUSPENDED":
      return [
        { label: "Activate", next: "ACTIVE" },
        { label: "Mark as replaced", next: "REPLACED" },
      ];
    case "REPLACED":
      return [{ label: "Reactivate", next: "ACTIVE" }];
    default:
      return [];
  }
}

export function NfcCardsManager({ organizationId, cards, reassignTargets }: NfcCardsManagerProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [busyCardId, setBusyCardId] = useState<string | null>(null);
  const [reassigningCardId, setReassigningCardId] = useState<string | null>(null);
  const [reassignDestination, setReassignDestination] = useState("");
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/businesses/${organizationId}/cards`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong creating the card.");
        return;
      }
      router.refresh();
    } finally {
      setIsCreating(false);
    }
  }

  async function handleStatusChange(card: NFCCard, next: CardStatus) {
    setBusyCardId(card.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/cards/${card.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong updating the card.");
        return;
      }
      router.refresh();
    } finally {
      setBusyCardId(null);
    }
  }

  async function handleReassign(card: NFCCard) {
    if (!reassignDestination) return;
    const destinationName =
      reassignTargets.find((t) => t.id === reassignDestination)?.name ?? "the selected business";

    if (
      !window.confirm(
        `Reassign this card to "${destinationName}"? The same NFC URL will now point there.`
      )
    ) {
      return;
    }

    setBusyCardId(card.id);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/businesses/${organizationId}/cards/${card.id}/reassign`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destinationOrganizationId: reassignDestination }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong reassigning the card.");
        return;
      }
      setReassigningCardId(null);
      setReassignDestination("");
      router.refresh();
    } finally {
      setBusyCardId(null);
    }
  }

  async function handleCopy(card: NFCCard) {
    try {
      await navigator.clipboard.writeText(getCardUrl(card.token));
      setCopiedCardId(card.id);
      setTimeout(() => setCopiedCardId((current) => (current === card.id ? null : current)), 2000);
    } catch {
      setError("Couldn't copy the URL — copy it manually instead.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          NFC Cards
        </h2>
        <Button type="button" variant="secondary" disabled={isCreating} onClick={handleCreate}>
          {isCreating ? "Creating…" : "Create card"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {cards.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--admin-text-secondary)]">
          No NFC cards yet. Create one to give this business a physical card.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-[var(--admin-border)]">
          {cards.map((card) => {
            const url = getCardUrl(card.token);
            const isBusy = busyCardId === card.id;
            return (
              <li key={card.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge tone={statusTone(card.status)}>{card.status}</Badge>
                      <span className="text-xs text-[var(--admin-text-secondary)]">
                        Created {new Date(card.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate font-mono text-xs text-[var(--admin-text-secondary)] hover:underline"
                    >
                      {url}
                    </a>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="ghost" onClick={() => handleCopy(card)}>
                      {copiedCardId === card.id ? "Copied!" : "Copy URL"}
                    </Button>
                    {availableStatusActions(card.status).map((action) => (
                      <Button
                        key={action.next}
                        type="button"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() => handleStatusChange(card, action.next)}
                      >
                        {action.label}
                      </Button>
                    ))}
                    {reassignTargets.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={isBusy}
                        onClick={() =>
                          setReassigningCardId((current) => (current === card.id ? null : card.id))
                        }
                      >
                        Reassign
                      </Button>
                    )}
                  </div>
                </div>

                {reassigningCardId === card.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[var(--admin-bg)] p-3">
                    <select
                      value={reassignDestination}
                      onChange={(e) => setReassignDestination(e.target.value)}
                      className="rounded-lg border border-[var(--admin-border)] px-3 py-2 text-sm text-[var(--admin-text)] shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    >
                      <option value="">Select a business…</option>
                      {reassignTargets.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={!reassignDestination || isBusy}
                      onClick={() => handleReassign(card)}
                    >
                      Confirm reassign
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setReassigningCardId(null);
                        setReassignDestination("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
