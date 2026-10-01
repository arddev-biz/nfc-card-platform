import "server-only";
import { db } from "@/lib/db";
import { verificationInput } from "@/lib/validation/verification";
import {resolveProfileDesign,editableVisual} from "@/lib/profile-design";

export async function updateVerification(organizationId: string, input: unknown) {
  const parsed = verificationInput.parse(input);
  const {verificationBadge,...verification}=parsed;
  const data = {...verification,...("verificationTooltip" in parsed ? {verificationTooltip:parsed.verificationTooltip||null} : {})};
  if(verificationBadge!==undefined){
    const current=await db.businessProfile.findUniqueOrThrow({where:{organizationId},select:{designConfig:true,theme:true}});
    const design=resolveProfileDesign(current.designConfig,current.theme),visual=editableVisual(design);
    await db.businessProfile.update({where:{organizationId},data:{...data,designConfig:{...design,visual:{...visual,badge:{...visual.badge,variant:verificationBadge}}}}});
    return {...verification,verificationTooltip:parsed.verificationTooltip||null,verificationBadge};
  }
  return db.businessProfile.update({ where: { organizationId }, data,
    select: { isVerified: true, verificationColor: true, verificationTooltip:true } });
}
