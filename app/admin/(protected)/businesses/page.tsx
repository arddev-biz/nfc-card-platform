import Link from "next/link";
import { listOrganizations } from "@/lib/services/organizations";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableCard, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { BusinessStatusActions } from "@/components/admin/BusinessStatusActions";
import { formatDate, organizationStatusTone, subscriptionStatusTone } from "@/lib/format";

export default async function BusinessesListPage() {
  const organizations = await listOrganizations();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Businesses"
        description="Manage all businesses connected to the platform."
        actions={
          <Link href="/admin/businesses/new">
            <Button>+ New business</Button>
          </Link>
        }
      />

      {organizations.length === 0 ? (
        <EmptyState
          title="No businesses yet."
          description="Create your first business to set up its profile and NFC card."
          action={
            <Link href="/admin/businesses/new">
              <Button>+ New business</Button>
            </Link>
          }
        />
      ) : (
        <TableCard>
          <TableHead>
            <tr>
              <Th>Business</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Slug</Th>
              <Th>Service</Th>
              <Th>Expires</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <Td className="font-medium">
                  <Link href={`/admin/businesses/${org.id}`} className="hover:underline">
                    {org.name}
                  </Link>
                </Td>
                <Td className="text-[var(--admin-text-secondary)]">{org.businessType || "—"}</Td>
                <Td>
                  <Badge tone={organizationStatusTone(org.status)}>{org.status}</Badge>
                </Td>
                <Td className="text-[var(--admin-text-secondary)]">/{org.slug}</Td>
                <Td>
                  {org.subscription ? (
                    <Badge tone={subscriptionStatusTone(org.subscription.status)}>
                      {org.subscription.status}
                    </Badge>
                  ) : (
                    <span className="text-[var(--admin-text-secondary)]">—</span>
                  )}
                </Td>
                <Td className="text-[var(--admin-text-secondary)]">
                  {org.subscription ? formatDate(org.subscription.endDate) : "—"}
                </Td>
                <Td className="text-[var(--admin-text-secondary)]">{formatDate(org.createdAt)}</Td>
                <Td>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link href={`/admin/businesses/${org.id}`}>
                      <Button type="button" variant="ghost">
                        View
                      </Button>
                    </Link>
                    <BusinessStatusActions organizationId={org.id} currentStatus={org.status} />
                  </div>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </TableCard>
      )}
    </div>
  );
}
