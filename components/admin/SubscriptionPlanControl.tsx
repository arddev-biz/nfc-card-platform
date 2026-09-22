"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/Button";
export function SubscriptionPlanControl({organizationId,initialPlan}:{organizationId:string;initialPlan:string}) {
  const [plan,setPlan]=useState(initialPlan),[busy,setBusy]=useState(false),[message,setMessage]=useState("");const router=useRouter();
  return <div className="mt-4 space-y-3"><label className="block">Subscription plan<select className="ml-3 rounded border border-[var(--admin-border)] bg-[var(--admin-input)] p-2" value={plan} onChange={e=>setPlan(e.target.value)}>
    {!["standard","premium"].includes(initialPlan)&&<option value={initialPlan}>{initialPlan}</option>}<option value="standard">Standard</option><option value="premium">Premium</option></select></label>
    <p className="text-sm text-[var(--admin-text-secondary)]">Premium branding requires an active, unexpired Premium subscription. This does not change billing, status, or service dates.</p>
    <Button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{const r=await fetch(`/api/admin/businesses/${organizationId}/subscription`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({plan})});if(!r.ok)throw new Error();setMessage("Saved subscription plan");router.refresh();}catch{setMessage("Plan was not saved.");}finally{setBusy(false);}}}>Save plan</Button><p role="status">{message}</p>
  </div>;
}
