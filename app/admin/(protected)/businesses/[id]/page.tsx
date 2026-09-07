import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganizationById, listOrganizations } from "@/lib/services/organizations";
import { listProfileLinks } from "@/lib/services/profile-links";
import { listCardsForOrganization } from "@/lib/services/nfc-cards";
import { getMenuForOrganization } from "@/lib/services/menus";
import { BusinessForm, type BusinessFormValues } from "@/components/admin/BusinessForm";
import { BusinessStatusActions } from "@/components/admin/BusinessStatusActions";
import { ProfileLinksManager } from "@/components/admin/ProfileLinksManager";
import { NfcCardsManager } from "@/components/admin/NfcCardsManager";
import { MenuManager } from "@/components/admin/MenuManager";
import { BusinessImagesManager } from "@/components/admin/BusinessImagesManager";
import { Badge } from "@/components/ui/Badge";
import { formatDate, organizationStatusTone, subscriptionStatusTone } from "@/lib/format";

export default async function EditBusinessPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string };
}) {
  const organization = await getOrganizationById(params.id);

  if (!organization || !organization.profile) {
    notFound();
  }

  const profile = organization.profile;
  const latestSubscription = organization.subscriptions[0] ?? null;
  const links = await listProfileLinks(organization.id);
  const cards = await listCardsForOrganization(organization.id);
  const { isEnabled: isMenuEnabled, menu } = await getMenuForOrganization(organization.id);
  const allOrganizations = await listOrganizations();
  const reassignTargets = allOrganizations
    .filter((org) => org.id !== organization.id && org.status !== "ARCHIVED")
    .map((org) => ({ id: org.id, name: org.name }));

  const initialValues: Partial<BusinessFormValues> = {
    businessName: organization.name,
    slug: organization.slug,
    businessType: organization.businessType ?? "",
    bio: profile.bio ?? "",
    phone: profile.phone ?? "",
    whatsapp: profile.whatsapp ?? "",
    email: profile.email ?? "",
    website: profile.website ?? "",
    address: profile.address ?? "",
    googleMapsUrl: profile.googleMapsUrl ?? "",
    displayName: profile.displayName,
    themeColor: profile.themeColor ?? "",
    backgroundType: profile.backgroundType ?? "",
    backgroundColor: profile.backgroundColor ?? "",
    backgroundGradient: profile.backgroundGradient ?? "",
    backgroundMode: profile.backgroundMode ?? "",
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/businesses" className="text-sm text-[var(--admin-text-secondary)] hover:underline">
            &larr; Back to businesses
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--admin-text)]">{organization.name}</h1>
          {organization.status === "ACTIVE" ? (
            <Link
              href={`/${organization.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--admin-text-secondary)] hover:underline"
            >
              View public profile ↗
            </Link>
          ) : (
            <p className="text-sm text-[var(--admin-text-secondary)]">
              Public profile hidden while {organization.status.toLowerCase()}
            </p>
          )}
        </div>
        <Badge tone={organizationStatusTone(organization.status)}>{organization.status}</Badge>
      </div>

      {searchParams.created === "1" && (
        <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Business created successfully.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
          Service / Subscription
        </h2>
        {latestSubscription ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
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
          <p className="mt-3 text-sm text-[var(--admin-text-secondary)]">No subscription record found.</p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--admin-text-secondary)]">
            Business Status
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-text-secondary)]">
            Archiving does not delete any data — it can be restored later.
          </p>
        </div>
        <BusinessStatusActions organizationId={organization.id} currentStatus={organization.status} />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <ProfileLinksManager organizationId={organization.id} links={links} />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <NfcCardsManager
          organizationId={organization.id}
          cards={cards}
          reassignTargets={reassignTargets}
        />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <MenuManager organizationId={organization.id} isEnabled={isMenuEnabled} menu={menu} />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <BusinessImagesManager
          organizationId={organization.id}
          logoUrl={profile.logoUrl}
          coverImageUrl={profile.coverImageUrl}
        />
      </div>

      <div className="mt-6 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-6">
        <BusinessForm
          mode="edit"
          organizationId={organization.id}
          initialValues={initialValues}
          backgroundImageUrl={profile.backgroundImageUrl}
        />
      </div>
    </div>
  );
}
