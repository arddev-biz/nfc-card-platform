import "server-only";
import { db } from "@/lib/db";
import { verificationInput } from "@/lib/validation/verification";

export async function updateVerification(organizationId: string, input: unknown) {
  const parsed = verificationInput.parse(input);
  const data = {...parsed,...("verificationTooltip" in parsed ? {verificationTooltip:parsed.verificationTooltip||null} : {})};
  return db.businessProfile.update({ where: { organizationId }, data,
    select: { isVerified: true, verificationColor: true, verificationTooltip:true } });
}
