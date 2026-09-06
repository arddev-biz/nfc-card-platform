import Link from "next/link";
import { notFound } from "next/navigation";
import { getLeadById } from "@/lib/services/leads";
import { Badge } from "@/components/ui/Badge";
import { LeadStatusActions } from "@/components/admin/LeadStatusActions";
import { ConvertLeadButton } from "@/components/admin/ConvertLeadButton";
import { formatDate } from "@/lib/format";

function statusTone(status: string): "green" | "amber" | "blue" | "gray" {
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

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const lead = await getLeadById(params.id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/leads" className="text-sm text-[var(--admin-text-secondary)] hover:underline">
        &larr; Back to leads
      </Link>

      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--admin-text)]">{lead.name}</h1>
        <Badge tone={statusTone(lead.status)}>{lead.status}</Badge>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Submission
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Contact name</dt>
            <dd className="font-medium text-[var(--admin-text)]">{lead.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Business name</dt>
            <dd className="font-medium text-[var(--admin-text)]">{lead.businessName}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Phone</dt>
            <dd className="font-medium text-[var(--admin-text)]">{lead.phone}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Email</dt>
            <dd className="font-medium text-[var(--admin-text)]">{lead.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Business type</dt>
            <dd className="font-medium text-[var(--admin-text)]">{lead.businessType || "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--admin-text-secondary)]">Submitted</dt>
            <dd className="font-medium text-[var(--admin-text)]">{formatDate(lead.createdAt)}</dd>
          </div>
        </dl>
        {lead.message && (
          <div className="mt-4">
            <dt className="text-sm text-[var(--admin-text-secondary)]">Message</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-[var(--admin-text)]">{lead.message}</dd>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Status
        </h2>
        <div className="mt-3">
          <LeadStatusActions leadId={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Business Conversion
        </h2>
        {lead.convertedOrganization ? (
          <p className="mt-3 text-sm text-[var(--admin-text)]">
            Converted to{" "}
            <Link
              href={`/admin/businesses/${lead.convertedOrganization.id}`}
              className="font-medium underline"
            >
              {lead.convertedOrganization.name}
            </Link>
            .
          </p>
        ) : (
          <div className="mt-3">
            <p className="mb-3 text-sm text-[var(--admin-text-secondary)]">
              Creates a new business using this lead&apos;s name, phone, email, and business type.
            </p>
            <ConvertLeadButton leadId={lead.id} />
          </div>
        )}
      </div>
    </div>
  );
}
