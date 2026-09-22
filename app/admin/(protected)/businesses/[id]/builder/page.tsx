import { redirect } from "next/navigation";

export default function LegacyProfileBuilderPage({ params }: { params: { id: string } }) {
  redirect(`/admin/businesses/${params.id}`);
}
