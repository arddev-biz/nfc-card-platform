import Link from "next/link";
import { listOrganizations } from "@/lib/services/organizations";
import { listLeads } from "@/lib/services/leads";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, organizationStatusTone } from "@/lib/format";

function StatCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const content = (
    <CardBody>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-text-secondary)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--admin-text)]">{value}</p>
    </CardBody>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="transition-colors hover:border-[var(--admin-accent)]">{content}</Card>
      </Link>
    );
  }
  return <Card>{content}</Card>;
}

export default async function AdminOverviewPage() {
  // Reuses the exact same service calls the Businesses/Leads pages
  // already use — no new queries, so every number here is real data
  // the app already computes elsewhere.
  const [organizations, leads] = await Promise.all([listOrganizations(), listLeads()]);

  const activeBusinesses = organizations.filter((org) => org.status === "ACTIVE").length;
  const newLeads = leads.filter((lead) => lead.status === "NEW").length;
  const recentBusinesses = organizations.slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="A snapshot of your platform."
        actions={
          <Link href="/admin/businesses/new">
            <Button>+ New business</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Businesses" value={organizations.length} href="/admin/businesses" />
        <StatCard label="Active" value={activeBusinesses} href="/admin/businesses" />
        <StatCard label="New leads" value={newLeads} href="/admin/leads?status=NEW" />
        <StatCard label="Total leads" value={leads.length} href="/admin/leads" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Recent businesses</h2>
        {recentBusinesses.length === 0 ? (
          <EmptyState
            title="No businesses yet."
            description="Create your first business to get started."
            action={
              <Link href="/admin/businesses/new">
                <Button>+ New business</Button>
              </Link>
            }
          />
        ) : (
          <Card>
            <ul className="divide-y divide-[var(--admin-border)]">
              {recentBusinesses.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/admin/businesses/${org.id}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--admin-bg)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                        {org.name}
                      </p>
                      <p className="text-xs text-[var(--admin-text-secondary)]">
                        {formatDate(org.createdAt)}
                      </p>
                    </div>
                    <Badge tone={organizationStatusTone(org.status)}>{org.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
