import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { VerificationManager } from "@/components/admin/VerificationManager";
export default async function VerificationPage() {
  await requireAdminSession();
  const entries = await db.businessProfile.findMany({ orderBy:{displayName:"asc"},
    select:{organizationId:true,displayName:true,isVerified:true,verificationColor:true,verificationTooltip:true} });
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Verification</h1>
    <p>Super Admin verification is independent of profile appearance. Unverified profiles have no public badge.</p>
    <VerificationManager entries={entries}/>
  </div>;
}
