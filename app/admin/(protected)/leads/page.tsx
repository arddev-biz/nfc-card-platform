import Link from "next/link";
import { listLeads } from "@/lib/services/leads";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@prisma/client";

const STATUS_FILTERS: { label: string; value: LeadStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Converted", value: "CONVERTED" },
  { label: "Closed", value: "CLOSED" },
];

function statusTone(status: LeadStatus): "green" | "amber" | "blue" | "gray" {
  switch (status) {
    case "NEW":
      return "blue";
    case "CONTACTED":
      return "amber";
    case "CONVERTED":
      return "green";
    default:
      return "gray";
  }
}

export default async function LeadsListPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const validStatuses: LeadStatus[] = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];
  const activeStatus =
    searchParams.status && validStatuses.includes(searchParams.status as LeadStatus)
      ? (searchParams.status as LeadStatus)
      : undefined;

  const leads = await listLeads(activeStatus);

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--admin-text)]">Leads</h1>
      <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
        Submissions from the public contact/order form.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive =
            filter.value === "ALL" ? !activeStatus : activeStatus === filter.value;
          const href =
            filter.value === "ALL" ? "/admin/leads" : `/admin/leads?status=${filter.value}`;
          return (
            <Link
              key={filter.value}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                isActive
                  ? "border-[var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-accent-text)]"
                  : "border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text)]"
              )}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)] p-12 text-center">
          <p className="text-[var(--admin-text)]">No leads yet.</p>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            Submissions from the landing pages contact/order form will appear here.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="min-w-full divide-y divide-[var(--admin-border)] text-sm">
            <thead className="bg-[var(--admin-bg)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Name</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Business</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Type</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Status</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Created</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--admin-text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3 font-medium text-[var(--admin-text)]">
                    <Link href={`/admin/leads/${lead.id}`} className="hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{lead.businessName}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{lead.phone}</td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{lead.businessType || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--admin-text-secondary)]">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`}>
                      <Button type="button" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
