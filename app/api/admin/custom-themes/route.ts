import {NextRequest,NextResponse} from "next/server";
import {getAdminApiUser,getSessionUser} from "@/lib/auth/session";
import {createCustomTheme,listCustomThemes} from "@/lib/services/custom-themes";
import {Prisma} from "@prisma/client";
import {ZodError} from "zod";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  if(!await getSessionUser())return NextResponse.json({error:"Unauthorized."},{status:401});
  try{return NextResponse.json({themes:await listCustomThemes()})}
  catch{return NextResponse.json({error:"Unable to load custom themes."},{status:503})}
}
export async function POST(request:NextRequest){
  const actor=await getAdminApiUser();
  if(!actor||actor.role!=="SUPER_ADMIN")return NextResponse.json({error:"Unauthorized."},{status:401});
  try{
    const raw=await request.text();
    if(raw.length>30000)return NextResponse.json({error:"Theme is too large."},{status:413});
    return NextResponse.json({theme:await createCustomTheme(JSON.parse(raw))},{status:201});
  }catch(error){
    const duplicate=error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002";
    return NextResponse.json({error:duplicate?"A theme with this name already exists.":error instanceof ZodError?error.issues.map(i=>i.message).join(" "):"Unable to save theme. Please retry."},{status:duplicate?409:400});
  }
}
