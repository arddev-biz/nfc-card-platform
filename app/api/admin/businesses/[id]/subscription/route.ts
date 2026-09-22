import {NextRequest,NextResponse} from "next/server";
import {getAdminApiUser} from "@/lib/auth/session";
import {db} from "@/lib/db";
import {z} from "zod";
export async function PATCH(request:NextRequest,{params}:{params:{id:string}}) {
  const user=await getAdminApiUser();
  if(!user||user.role!=="SUPER_ADMIN")return NextResponse.json({error:"Unauthorized."},{status:401});
  try {
    const {plan}=z.object({plan:z.enum(["standard","premium"])}).strict().parse(await request.json());
    await db.$transaction(async tx=>{
      await tx.$queryRaw`SELECT "id" FROM "BusinessProfile" WHERE "organizationId" = ${params.id} FOR UPDATE`;
      const subscription=await tx.subscription.findFirst({where:{organizationId:params.id},orderBy:[{createdAt:"desc"},{id:"desc"}],select:{id:true}});
      if(!subscription)throw new Error("Missing subscription");
      await tx.subscription.update({where:{id:subscription.id},data:{plan}});
    });
    return NextResponse.json({plan});
  }catch{return NextResponse.json({error:"Unable to update the existing subscription plan."},{status:400});}
}
