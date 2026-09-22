import { SubscriptionPlanControl } from "@/components/admin/SubscriptionPlanControl";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationById, listOrganizations } from "@/lib/services/organizations";
import { getBuilderProfileData, getResolvedBlockLayout } from "@/lib/services/profile-blocks";
import { listProfileLinks } from "@/lib/services/profile-links";
import { listCardsForOrganization } from "@/lib/services/nfc-cards";
import { isMenuAvailableForOrganization } from "@/lib/services/public-menu";
import { getMenuForOrganization } from "@/lib/services/menus";
import { buildProfileViewModel } from "@/lib/profileView";
import { computeAvailabilityFromViewModel } from "@/lib/blocks/availability";
import { ProfileBuilderShell } from "@/components/admin/ProfileBuilderShell";
import { BusinessAdminForm } from "@/components/admin/BusinessAdminForm";
import { BusinessStatusActions } from "@/components/admin/BusinessStatusActions";
import { NfcCardsManager } from "@/components/admin/NfcCardsManager";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate, organizationStatusTone, subscriptionStatusTone } from "@/lib/format";

export default async function BusinessEditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const [organization, business] = await Promise.all([getOrganizationById(params.id), getBuilderProfileData(params.id)]);

  if (!organization || !organization.profile || !business) {
    notFound();
  }

  const [links, cards, menuAvailable, menuState, allOrganizations] = await Promise.all([
    listProfileLinks(organization.id),
    listCardsForOrganization(organization.id),
    isMenuAvailableForOrganization(organization.id),
    getMenuForOrganization(organization.id),
    listOrganizations(),
  ]);
  const viewModel = buildProfileViewModel(business);
  const availability = computeAvailabilityFromViewModel(business, viewModel, menuAvailable);
  const blocks = business.v2?.version === 2 ? [] : await getResolvedBlockLayout(organization.id, availability);
  const latestSubscription = organization.subscriptions[0] ?? null;
  const reassignTargets = allOrganizations
    .filter((candidate) => candidate.id !== organization.id && candidate.status !== "ARCHIVED")
    .map((candidate) => ({ id: candidate.id, name: candidate.name }));

  const adminPanel = (
    <>
      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Business identity
        </h2>
        <BusinessAdminForm
          organizationId={organization.id}
          initialValues={{
            businessName: organization.name,
            slug: organization.slug,
            businessType: organization.businessType ?? "",
          }}
        />
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
              Business status
            </h2>
            <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
              Archiving preserves all business data.
            </p>
          </div>
          <BusinessStatusActions
            organizationId={organization.id}
            currentStatus={organization.status}
          />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Service / Subscription
        </h2>
        {latestSubscription && <SubscriptionPlanControl organizationId={organization.id} initialPlan={latestSubscription.plan}/>}
        {latestSubscription ? (
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[var(--admin-text-secondary)]">Plan</dt>
              <dd className="font-medium text-[var(--admin-text)]">{latestSubscription.plan}</dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-secondary)]">Status</dt>
              <dd>
                <Badge tone={subscriptionStatusTone(latestSubscription.status)}>
                  {latestSubscription.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-secondary)]">Start date</dt>
              <dd className="font-medium text-[var(--admin-text)]">
                {formatDate(latestSubscription.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--admin-text-secondary)]">End date</dt>
              <dd className="font-medium text-[var(--admin-text)]">
                {formatDate(latestSubscription.endDate)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-[var(--admin-text-secondary)]">
            No subscription record found.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5">
        <NfcCardsManager
          organizationId={organization.id}
          cards={cards}
          reassignTargets={reassignTargets}
        />
      </section>
    </>
  );

  return (
    <div className="space-y-6">
      <Link href="/admin/businesses" className="text-sm hover:underline">← Back to Businesses</Link>
      <PageHeader
        title={organization.name}
        description="Manage the public profile, design, layout, links, menu, and administrative details."
        actions={
          <div className="flex items-center gap-3">
            <Badge tone={organizationStatusTone(organization.status)}>{organization.status}</Badge>
            {organization.status === "ACTIVE" && (
              <Link
                href={`/${organization.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--admin-text-secondary)] hover:underline"
              >
                View public profile ↗
              </Link>
            )}
          </div>
        }
      />

      {searchParams.created === "1" && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Business created successfully.
        </p>
      )}

      {organization.status !== "ACTIVE" && (
        <p className="text-sm">Public profile hidden while {organization.status.toLowerCase()}.</p>
      )}

      <ProfileBuilderShell
        organizationId={organization.id}
        businessSlug={organization.slug}
        business={business}
        initialBlocks={blocks}
        initialLinks={links}
        menuAvailable={menuAvailable}
        isMenuEnabled={menuState.isEnabled}
        menu={menuState.menu}
        adminPanel={adminPanel}
      />
    </div>
  );
}
