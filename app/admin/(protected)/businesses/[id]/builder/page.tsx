import { getOrganizationById } from "@/lib/services/organizations";
import {
  getBuilderProfileData,
  getResolvedBlockLayout,
} from "@/lib/services/profile-blocks";
import { computeAvailabilityFromViewModel } from "@/lib/blocks/availability";
import { isMenuAvailableForOrganization } from "@/lib/services/public-menu";
import { getMenuForOrganization } from "@/lib/services/menus";
import { buildProfileViewModel } from "@/lib/profileView";
import { ProfileBuilderShell } from "@/components/admin/ProfileBuilderShell";
import { BusinessSubNav } from "@/components/admin/BusinessSubNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { notFound } from "next/navigation";

export default async function ProfileBuilderPage({ params }: { params: { id: string } }) {
  const organization = await getOrganizationById(params.id);
  const business = await getBuilderProfileData(params.id);

  if (!organization || !business) {
    notFound();
  }

  const menuAvailable = await isMenuAvailableForOrganization(params.id);
  const { isEnabled: isMenuEnabled, menu } = await getMenuForOrganization(params.id);
  const viewModel = buildProfileViewModel(business);
  const availability = computeAvailabilityFromViewModel(business, viewModel, menuAvailable);
  const blocks = await getResolvedBlockLayout(params.id, availability);

  return (
    <div className="space-y-6">
      <PageHeader
        title={organization.name}
        description="Edit everything customers see on your public profile — content, links, and design — in one place."
      />

      <BusinessSubNav organizationId={params.id} active="builder" />

      <ProfileBuilderShell
        organizationId={params.id}
        businessSlug={organization.slug}
        business={business}
        initialBlocks={blocks}
        menuAvailable={menuAvailable}
        isMenuEnabled={isMenuEnabled}
        menu={menu}
      />
    </div>
  );
}
