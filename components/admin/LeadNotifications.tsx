"use client";
import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
const UPDATED="admin-leads-seen";

export function useUnseenLeadCount() {
  const pathname=usePathname();
  const [count,setCount]=useState(0);
  useEffect(()=>{
    let active=true;
    let controller:AbortController|undefined;
    const refresh=async()=>{
      controller?.abort();controller=new AbortController();
      try{
        const response=await fetch("/api/admin/leads/notifications",{cache:"no-store",signal:controller.signal});
        if(response.ok){const data=await response.json();if(active&&Number.isSafeInteger(data.count)&&data.count>=0)setCount(data.count)}
      }catch{/* Keep the last confirmed count on transient failures. */}
    };
    void refresh();window.addEventListener(UPDATED,refresh);window.addEventListener("focus",refresh);
    return()=>{active=false;controller?.abort();window.removeEventListener(UPDATED,refresh);window.removeEventListener("focus",refresh)};
  },[pathname]);
  return count;
}

export function AcknowledgeLeadSnapshot() {
  useEffect(()=>{
    let active=true;
    // Only mounted page visits acknowledge. Server prefetches never mark leads seen.
    // A fresh snapshot also handles returning to a page held in Next's router cache.
    void (async()=>{
      const snapshot=await fetch("/api/admin/leads/notifications?snapshot=1",{cache:"no-store"});
      if(!active||!snapshot.ok)return;
      const {ids}=await snapshot.json();
      if(!active||!Array.isArray(ids))return;
      if(ids.length){const response=await fetch("/api/admin/leads/notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids})});if(!response.ok)return}
      window.dispatchEvent(new Event(UPDATED));
    })().catch(()=>{});
    return()=>{active=false};
  },[]);
  return null;
}
