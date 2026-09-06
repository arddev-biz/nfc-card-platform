import Link from "next/link";
import { listOrganizations } from "@/lib/services/organizations";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BusinessStatusActions } from "@/components/admin/BusinessStatusActions";
import { formatDate, organizationStatusTone, subscriptionStatusTone } from "@/lib/format";

export default async function BusinessesListPage() {
  const organizations = await listOrganizations();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--admin-text)]">Businesses</h1>
        <Link href="/admin/businesses/new">
          <Button>New business</Button>
        </Link>
      </div>

      {organizations.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-card)] p-12 text-center">
          <p className="text-[var(--admin-text)]">No businesses yet.</p>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            Create your first business to set up its profile and NFC card.
          </p>
          <Link href="/admin/businesses/new" className="mt-4 inline-block">
            <Button>New business</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]">
          <table className="min-w-full divide-y divide-[var(--admin-border)] text-sm">
            <thead className="bg-[var(--admin-bg)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Business</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Service</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Expires</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Created</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    <Link href={`/admin/businesses/${org.id}`} className="hover:underline">
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{org.businessType || "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={organizationStatusTone(org.status)}>{org.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">/{org.slug}</td>
                  <td className="px-4 py-3">
                    {org.subscription ? (
                      <Badge tone={subscriptionStatusTone(org.subscription.status)}>
                        {org.subscription.status}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {org.subscription ? formatDate(org.subscription.endDate) : "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(org.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/businesses/${org.id}`}>
                        <Button type="button" variant="ghost">
                          View / Edit
                        </Button>
                      </Link>
                      <BusinessStatusActions organizationId={org.id} currentStatus={org.status} />
                    </div>
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
