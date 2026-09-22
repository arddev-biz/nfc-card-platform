"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
interface Plan { fingerprint:string;warning:string;fields:Record<string,boolean>;links:{id:string;visible:boolean}[];rows:{oldSection:string;destination:string;oldVisibility:boolean;resultingVisibility:boolean;oldPosition:number;proposedPosition:number;behavior:string}[] }
export function V2Upgrade({organizationId}:{organizationId:string}) {
  const [plan,setPlan]=useState<Plan|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function request(confirm=false) {
    setBusy(true);setError("");
    try {
      const r=await fetch(`/api/admin/businesses/${organizationId}/v2/upgrade`,confirm?{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fingerprint:plan?.fingerprint,confirm:true})}:undefined);
      const d=await r.json();if(!r.ok)throw new Error(d.error);
      if(confirm)window.location.reload();else setPlan(d);
    }catch(e){setError(e instanceof Error?e.message:"Unable to upgrade.");}finally{setBusy(false);}
  }
  return <div className="my-4 space-y-3 rounded-xl border border-[var(--admin-border)] p-4">
    <p className="text-sm">Legacy presentation is preserved. Upgrading is optional.</p>
    {!plan?<Button type="button" disabled={busy} variant="secondary" onClick={()=>void request()}>Preview Upgrade to V2</Button>:<>
      <p>{plan.warning}</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["Old section","V2 destination","Old visibility","New visibility","Old position","New position","Behavior"].map(s=><th className="p-2" key={s}>{s}</th>)}</tr></thead>
        <tbody>{plan.rows.map(r=><tr key={r.oldSection}><td className="p-2">{r.oldSection}</td><td>{r.destination}</td><td>{String(r.oldVisibility)}</td><td>{String(r.resultingVisibility)}</td><td>{r.oldPosition}</td><td>{r.proposedPosition}</td><td>{r.behavior}</td></tr>)}</tbody></table></div>
      <p className="text-sm">Business Info: {Object.entries(plan.fields).map(([k,v])=>`${k}: ${v?"visible":"hidden"}`).join("; ")}</p>
      <p className="text-sm">{plan.links.filter(l=>l.visible).length} links proposed visible; {plan.links.filter(l=>!l.visible).length} remain hidden/inactive. Hidden source actions are not enabled.</p>
      <div className="flex gap-2"><Button type="button" disabled={busy} onClick={()=>void request(true)}>Confirm explicit conversion</Button><Button type="button" disabled={busy} variant="secondary" onClick={()=>setPlan(null)}>Cancel without changes</Button></div>
    </>}
    {error&&<p role="alert">{error}</p>}
  </div>;
}
