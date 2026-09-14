import { BusinessForm } from "@/components/admin/BusinessForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export default function NewBusinessPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="New business"
        description="This creates the business account, its public profile, and a 12-month service record."
      />

      <Card>
        <CardBody>
          <BusinessForm mode="create" />
        </CardBody>
      </Card>
    </div>
  );
}
