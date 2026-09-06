"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ConvertLeadButton({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    if (
      !window.confirm(
        "Convert this lead into a business? This creates a new Organization, profile, and 12-month service record."
      )
    ) {
      return;
    }

    setIsConverting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/convert`, { method: "POST" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Something went wrong converting this lead.");
        setIsConverting(false);
        return;
      }

      router.push(`/admin/businesses/${data.organization.id}?created=1`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setIsConverting(false);
    }
  }

  return (
    <div>
      <Button type="button" disabled={isConverting} onClick={handleConvert}>
        {isConverting ? "Converting…" : "Convert to Business"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
