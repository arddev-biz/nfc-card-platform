"use client";

import { useState } from "react";
import Image from "next/image";
import {useUploadActivity} from "./UploadActivity";

export function HeaderImagePicker({label,url,organizationId,onChange}:{label:"Logo"|"Cover image";url:string|null;organizationId:string;onChange:(url:string|null)=>void}){
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const {begin}=useUploadActivity();
  const upload=async(file:File)=>{
    const end=begin();setBusy(true);setError("");
    try{
      const body=new FormData();body.append("file",file);
      const response=await fetch(`/api/admin/businesses/${organizationId}/v2/assets`,{method:"POST",body});
      const result=await response.json();
      if(!response.ok||!result.asset?.url)throw new Error(result.error||"Upload failed.");
      try{onChange(result.asset.url)}catch(cause){await fetch(`/api/admin/businesses/${organizationId}/v2/assets?assetId=${encodeURIComponent(result.asset.id)}`,{method:"DELETE"});throw cause}
    }catch(cause){setError(cause instanceof Error?cause.message:"Upload failed.")}finally{setBusy(false);end()}
  };
  return <div className="builder-v3-card space-y-3"><div className="flex items-center justify-between gap-3"><strong>{label}</strong>{url&&<button type="button" className="builder-v3-delete" onClick={()=>onChange(null)}>Remove</button>}</div>
    {url?<Image unoptimized src={url} width={label==="Logo"?80:600} height={label==="Logo"?80:200} alt={`${label} preview`} className={label==="Logo"?"h-20 w-20 rounded-full object-cover":"h-24 w-full rounded-lg object-cover"}/>:<div className="builder-v3-note">No {label.toLowerCase()} selected.</div>}
    <label className="block text-sm cursor-pointer">{busy?"Uploading…":`Choose ${label.toLowerCase()}`}<input className="block mt-2 w-full text-xs" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);event.target.value=""}}/></label>
    {error&&<p role="alert" className="builder-v3-error">{error}</p>}
    <p className="builder-v3-note">The profile image changes only after Save Changes.</p>
  </div>;
}
