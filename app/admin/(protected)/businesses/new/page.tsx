import { BusinessForm } from "@/components/admin/BusinessForm";

export default function NewBusinessPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-[var(--admin-text)]">New business</h1>
      <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
        This creates the business account, its public profile, and a
        12-month service record.
      </p>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <BusinessForm mode="create" />
      </div>
    </div>
  );
}
