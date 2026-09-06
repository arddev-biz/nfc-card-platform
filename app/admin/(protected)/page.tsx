import Link from "next/link";
import { requireAdminSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/Button";

export default async function AdminHomePage() {
  const user = await requireAdminSession();

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--admin-text)]">
        You are authenticated
      </h1>
      <p className="mt-2 text-[var(--admin-text-secondary)]">
        Signed in as <span className="font-medium text-[var(--admin-text)]">{user.email}</span>.
        Card and inquiry management will be added in later phases.
      </p>
      <Link href="/admin/businesses" className="mt-4 inline-block">
        <Button>Go to businesses</Button>
      </Link>
    </div>
  );
}
