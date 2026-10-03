import {NextRequest,NextResponse} from "next/server";
import {z} from "zod";
import {getAdminApiUser} from "@/lib/auth/session";
import {countUnseenLeads,acknowledgeLeads,unseenLeadSnapshot} from "@/lib/services/leads";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:NextRequest) {
  if(!await getAdminApiUser())return NextResponse.json({error:"Unauthorized."},{status:401,headers});
  if(request?.nextUrl.searchParams.get("snapshot")==="1")return NextResponse.json({ids:(await unseenLeadSnapshot()).map(lead=>lead.id)},{headers});
  return NextResponse.json({count:await countUnseenLeads()},{headers});
}
export async function POST(request:NextRequest) {
  if(!await getAdminApiUser())return NextResponse.json({error:"Unauthorized."},{status:401,headers});
  const parsed=z.object({ids:z.array(z.string().min(1).max(64))}).safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid lead acknowledgement."},{status:400,headers});
  return NextResponse.json({count:await acknowledgeLeads(parsed.data.ids)},{headers});
}
