"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/profile/VerificationBadge";
import { Field } from "@/components/admin/profile-builder/V2Controls";
type Entry = { organizationId: string; displayName: string; isVerified: boolean; verificationColor: string; verificationTooltip?:string|null };
function VerificationRow({ initial }: { initial: Entry }) {
  const [saved,setSaved] = useState(initial), [color,setColor] = useState(initial.verificationColor);
  const [tooltip,setTooltip]=useState(initial.verificationTooltip??"");
  const [busy,setBusy] = useState(false), [message,setMessage] = useState("");
  async function save(isVerified: boolean) {
    if (!isVerified && saved.isVerified && !window.confirm(`Remove verification from ${saved.displayName}?`)) return;
    setBusy(true); setMessage("");
    try {
      const r = await fetch(`/api/admin/businesses/${saved.organizationId}/verification`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({isVerified,verificationColor:color,verificationTooltip:tooltip||null}) });
      const result = await r.json(); if (!r.ok || !result.verification) throw new Error(result.error || "Save failed.");
      setSaved({...saved,...result.verification}); setColor(result.verification.verificationColor); setMessage("Saved");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Save failed."); }
    finally { setBusy(false); }
  }
  return <fieldset disabled={busy} className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] p-5 space-y-4">
    <div className="flex items-center gap-2"><Link className="font-semibold underline" href={`/admin/businesses/${saved.organizationId}`}>{saved.displayName}</Link>{saved.isVerified && <VerificationBadge color={saved.verificationColor} tooltip={saved.verificationTooltip}/>}</div>
    <p>{saved.isVerified ? "Verified" : "Not verified"}</p>
    <Field label="Verification tooltip (optional)" value={tooltip} onChange={setTooltip}/>
    <Field label="Badge color" type="color" value={color} onChange={setColor}/>
    <div className="flex flex-wrap gap-2"><Button type="button" onClick={()=>void save(true)}>{saved.isVerified ? "Save badge color" : "Verify business"}</Button>
      {saved.isVerified && <Button type="button" variant="secondary" onClick={()=>void save(false)}>Remove verification</Button>}
      <Button type="button" variant="secondary" onClick={()=>setColor("#2563EB")}>Default blue</Button></div>
    <p role="status">{message}</p>
  </fieldset>;
}
export function VerificationManager({ entries }: { entries: Entry[] }) {
  const [search,setSearch] = useState("");
  return <div className="space-y-5"><Field label="Find business" value={search} onChange={setSearch}/>
    {entries.map(entry=><div key={entry.organizationId} hidden={!entry.displayName.toLowerCase().includes(search.toLowerCase())}><VerificationRow initial={entry}/></div>)}
  </div>;
}
