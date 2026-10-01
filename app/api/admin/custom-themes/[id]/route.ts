import {NextRequest,NextResponse} from "next/server";
import {getAdminApiUser} from "@/lib/auth/session";
import {updateCustomTheme,deleteCustomTheme} from "@/lib/services/custom-themes";
import {Prisma} from "@prisma/client";
import {ZodError} from "zod";
export const runtime="nodejs";
function failure(error:unknown){
 const code=error instanceof Prisma.PrismaClientKnownRequestError?error.code:null;
 return NextResponse.json({error:code==="P2002"?"A theme with this name already exists.":code==="P2025"?"This custom theme is no longer available.":error instanceof ZodError?error.issues.map(i=>i.message).join(" "):"Unable to change theme. Please retry."},{status:code==="P2002"?409:code==="P2025"?404:400});
}
export async function PATCH(request:NextRequest,{params}:{params:{id:string}}){
 const actor=await getAdminApiUser();if(!actor||actor.role!=="SUPER_ADMIN")return NextResponse.json({error:"Unauthorized."},{status:401});
 try{const raw=await request.text();if(raw.length>30000)return NextResponse.json({error:"Theme is too large."},{status:413});return NextResponse.json({theme:await updateCustomTheme(params.id,JSON.parse(raw))});}catch(error){return failure(error)}
}
export async function DELETE(_request:NextRequest,{params}:{params:{id:string}}){
 const actor=await getAdminApiUser();if(!actor||actor.role!=="SUPER_ADMIN")return NextResponse.json({error:"Unauthorized."},{status:401});
 try{await deleteCustomTheme(params.id);return NextResponse.json({ok:true});}catch(error){return failure(error)}
}
