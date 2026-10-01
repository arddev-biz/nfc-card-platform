import { NextRequest,NextResponse } from "next/server";
import { getAdminApiUser } from "@/lib/auth/session";
import { builderDraftSchema } from "@/lib/profile-builder-draft";
import { saveBuilderDraft } from "@/lib/services/profile-builder-save";
import { V2Error } from "@/lib/services/profile-v2";
import { ZodError } from "zod";
export const runtime="nodejs";
export async function POST(request:NextRequest,{params}:{params:{id:string}}){
  const actor=await getAdminApiUser();
  if(!actor||actor.role!=="SUPER_ADMIN")return NextResponse.json({error:"Unauthorized."},{status:401});
  try{
    const raw=await request.text();
    if(raw.length>500000)return NextResponse.json({error:"Draft is too large."},{status:413});
    const saved=await saveBuilderDraft(params.id,builderDraftSchema.parse(JSON.parse(raw)));
    return NextResponse.json(saved);
  }catch(error){
    const message=error instanceof V2Error?error.message:error instanceof ZodError?error.issues.map(i=>i.message).join(" "):"Unable to save. Your draft is still available; please retry.";
    return NextResponse.json({error:message},{status:error instanceof V2Error?409:400});
  }
}
