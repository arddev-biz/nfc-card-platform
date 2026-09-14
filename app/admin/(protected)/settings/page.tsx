import { requireAdminSession } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export default async function AdminSettingsPage() {
  const user = await requireAdminSession();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your admin account for this platform." />

      <Card className="max-w-lg">
        <CardBody className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-text-secondary)]">
              Email
            </p>
            <p className="mt-1 text-sm text-[var(--admin-text)]">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-text-secondary)]">
              Role
            </p>
            <p className="mt-1 text-sm text-[var(--admin-text)]">{user.role}</p>
          </div>
        </CardBody>
      </Card>

      <p className="text-sm text-[var(--admin-text-secondary)]">
        Additional platform settings will appear here in a future update.
      </p>
    </div>
  );
}
